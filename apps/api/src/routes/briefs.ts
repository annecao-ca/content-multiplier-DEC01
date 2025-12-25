import { FastifyPluginAsync } from 'fastify';
import { q } from '../db.ts';
import briefSchema from '../../../../packages/schemas/brief.schema.json' assert { type: 'json' };
import { ensureValid } from '../../../../packages/utils/validate.ts';
import { llm } from '../services/llm.ts';
import { retrieve } from '../services/rag.ts';
import { logEvent } from '../services/telemetry.ts';
import { env } from '../env.ts';

/**
 * Get the best available LLM model based on configured API keys
 */
function getAvailableLLMModel(): string {
    const hasOpenAI = !!(env.OPENAI_API_KEY || process.env.OPENAI_API_KEY);
    const hasDeepSeek = !!(env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY);
    
    if (hasOpenAI) {
        return env.LLM_MODEL || 'gpt-4o-mini';
    } else if (hasDeepSeek) {
        return 'deepseek-chat';
    } else {
        return 'deepseek-chat';
    }
}

const routes: FastifyPluginAsync = async (app) => {
    // List all briefs
    app.get('/', async (req: any) => {
        try {
            const briefs = await q('SELECT * FROM briefs ORDER BY created_at DESC');
            return briefs.map((b: any) => {
                const safeParse = (val: any) => {
                    if (!val) return [];
                    if (typeof val === 'string') {
                        try { return JSON.parse(val); } catch { return []; }
                    }
                    return val;
                };
                return {
                    ...b,
                    key_points: safeParse(b.key_points),
                    counterpoints: safeParse(b.counterpoints),
                    outline: safeParse(b.outline),
                    claims_ledger: safeParse(b.claims_ledger)
                };
            });
        } catch (error: any) {
            console.error('Failed to list briefs:', error.message);
            return [];
        }
    });

    app.get('/:brief_id', async (req: any) => {
        const { brief_id } = req.params
        const [b] = await q('SELECT * FROM briefs WHERE brief_id=$1', [brief_id])
        if (!b) return { error: 'Brief not found' }

        const safeParse = (val: any) => {
            if (!val) return []
            if (typeof val === 'string') return JSON.parse(val)
            return val
        }

        return {
            ...b,
            key_points: safeParse(b.key_points),
            counterpoints: safeParse(b.counterpoints),
            outline: safeParse(b.outline),
            claims_ledger: safeParse(b.claims_ledger)
        }
    });

    app.post('/generate', async (req: any) => {
        const { brief_id, idea_id, query, language = 'en', topK = 8, minSimilarity = 0.7 } = req.body;
        
        // Truy vấn RAG bằng cosine similarity
        let snippets = [];
        let ragMetadata = {
            totalResults: 0,
            averageScore: 0,
            highConfidenceResults: 0
        };
        
        try {
            console.log(`[Brief] Querying RAG with: "${query}" (topK: ${topK}, minSimilarity: ${minSimilarity})`);
            const hits = await retrieve(query, topK, llm.embed);
            
            if (hits && hits.length > 0) {
                // Lọc theo similarity score và format snippets
                const filteredHits = hits.filter((h: any) => {
                    const score = parseFloat(h.score) || 0;
                    return score >= minSimilarity;
                });
                
                snippets = filteredHits.map((h: any) => {
                    const score = parseFloat(h.score) || 0;
                    return {
                        url: h.url || `doc:${h.doc_id}`,
                        quote: h.content.slice(0, 400), // Tăng độ dài quote
                        title: h.title || 'Untitled',
                        author: h.author || null,
                        similarity: score,
                        doc_id: h.doc_id
                    };
                });
                
                // Tính toán metadata
                const scores = filteredHits.map((h: any) => parseFloat(h.score) || 0);
                ragMetadata = {
                    totalResults: filteredHits.length,
                    averageScore: scores.length > 0 
                        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
                        : 0,
                    highConfidenceResults: scores.filter((s: number) => s >= 0.8).length
                };
                
                console.log(`[Brief] RAG results: ${filteredHits.length} hits (avg score: ${ragMetadata.averageScore.toFixed(3)})`);
            } else {
                console.log('[Brief] No RAG results found');
                snippets = [{ 
                    url: 'placeholder', 
                    quote: 'No relevant documents found in knowledge base',
                    similarity: 0
                }];
            }
        } catch (err: any) {
            console.log('[Brief] RAG retrieval failed:', err.message);
            snippets = [{ 
                url: 'placeholder', 
                quote: 'RAG retrieval unavailable. Proceeding without knowledge base context.',
                similarity: 0
            }];
        }

        const contentSchema = {
            type: 'object',
            required: ['outline', 'claims_ledger'],
            properties: {
                key_points: briefSchema.properties.key_points,
                counterpoints: briefSchema.properties.counterpoints,
                outline: briefSchema.properties.outline,
                claims_ledger: briefSchema.properties.claims_ledger
            }
        }

        const system = language === 'vn'
            ? 'Bạn là một nhà nghiên cứu. Xây dựng một bản tóm tắt với dàn ý và sổ cái tuyên bố. Mỗi tuyên bố phải có nguồn từ bằng chứng RAG (sử dụng similarity score cao nhất). Định dạng: {"key_points":[],"outline":[{h2:"",bullets:[]}],"claims_ledger":[{claim:"",sources:[{url:""}]}]}'
            : 'You are a researcher. Build a brief with outline and a claims_ledger. Every claim must cite sources from the RAG evidence (prefer higher similarity scores). Format: {"key_points":[],"outline":[{h2:"",bullets:[]}],"claims_ledger":[{claim:"",sources:[{url:""}]}]}';

        // Format evidence với similarity scores để LLM biết độ tin cậy
        const evidenceText = snippets.length > 0
            ? snippets
                .sort((a: any, b: any) => (b.similarity || 0) - (a.similarity || 0)) // Sắp xếp theo similarity cao nhất
                .map((s: any, idx: number) => {
                    const similarityLabel = s.similarity 
                        ? `[Similarity: ${(s.similarity * 100).toFixed(1)}%]` 
                        : '';
                    const sourceInfo = s.title ? `\nSource: ${s.title}${s.author ? ` by ${s.author}` : ''}` : '';
                    return `${idx + 1}. ${similarityLabel}${sourceInfo}\n   "${s.quote}"\n   URL: ${s.url}`;
                })
                .join('\n\n')
            : 'No evidence available from knowledge base.';

        const user = language === 'vn'
            ? `Chủ đề nghiên cứu: ${query}\nÝ tưởng ID: ${idea_id}\n\nBằng chứng từ RAG (đã sắp xếp theo độ tương đồng cosine similarity):\n${evidenceText}\n\nThống kê RAG: ${ragMetadata.totalResults} kết quả, điểm trung bình: ${(ragMetadata.averageScore * 100).toFixed(1)}%, kết quả độ tin cậy cao (≥80%): ${ragMetadata.highConfidenceResults}\n\nYêu cầu:\n1. Sử dụng bằng chứng RAG có similarity score cao để xây dựng claims_ledger\n2. Mỗi claim phải có ít nhất 1 source từ bằng chứng trên\n3. Ưu tiên sử dụng các snippet có similarity ≥ 0.8\n4. Tạo một bản tóm tắt nghiên cứu chi tiết ở định dạng JSON.`
            : `Research Topic: ${query}\nIdea ID: ${idea_id}\n\nRAG Evidence (sorted by cosine similarity score):\n${evidenceText}\n\nRAG Statistics: ${ragMetadata.totalResults} results, average score: ${(ragMetadata.averageScore * 100).toFixed(1)}%, high confidence (≥80%): ${ragMetadata.highConfidenceResults}\n\nRequirements:\n1. Use high similarity RAG evidence to build claims_ledger\n2. Each claim must cite at least 1 source from the evidence above\n3. Prefer snippets with similarity ≥ 0.8\n4. Create a detailed research brief in JSON format.`;
        
        let brief;
        try {
            const result = await llm.completeJSON({ model: getAvailableLLMModel(), system, user, jsonSchema: contentSchema });
            brief = result.brief || result;
        } catch (error) {
            console.log('LLM failed, using fallback brief:', error);
            // Fallback brief when LLM fails
            brief = {
                key_points: [
                    `Research topic: ${query}`,
                    "Key insights to be developed",
                    "Supporting evidence analysis",
                    "Strategic implications"
                ],
                counterpoints: [
                    "Alternative perspectives to consider",
                    "Potential limitations or challenges"
                ],
                outline: [
                    { h2: "Introduction", bullets: ["Overview of the topic", "Current landscape"] },
                    { h2: "Key Findings", bullets: ["Primary insights", "Supporting data"] },
                    { h2: "Analysis", bullets: ["Deep dive into implications", "Comparison with alternatives"] },
                    { h2: "Conclusion", bullets: ["Summary of recommendations", "Next steps"] }
                ],
                claims_ledger: [
                    { claim: "This is a placeholder claim about the topic", sources: [{ url: "placeholder" }] }
                ]
            };
        }
        console.log('Generated brief:', JSON.stringify(brief).slice(0, 200))
        ensureValid(contentSchema, brief);
        
        // Try to save to DB (best effort)
        try {
            await q('INSERT INTO briefs(brief_id, idea_id, key_points, counterpoints, outline, claims_ledger) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (brief_id) DO UPDATE SET key_points=$3,counterpoints=$4,outline=$5,claims_ledger=$6', [
                brief_id, idea_id, JSON.stringify(brief.key_points || []), JSON.stringify(brief.counterpoints || []), JSON.stringify(brief.outline || []), JSON.stringify(brief.claims_ledger || [])
            ]);
        } catch (dbError: any) {
            console.warn('Failed to save brief to DB (ignored):', dbError.message);
        }
        
        // Try to log event (best effort)
        try {
            await logEvent({
                event_type: 'brief.created',
                actor_id: (req as any).actor_id,
                actor_role: (req as any).actor_role,
                idea_id,
                brief_id,
                request_id: (req as any).request_id,
                timezone: (req as any).timezone,
                payload: { claims: (brief.claims_ledger || []).length }
            });
        } catch (logError: any) {
            console.warn('Failed to log brief.created event (ignored):', logError.message);
        }
        
        // Return brief with metadata including RAG information
        return {
            ok: true,
            brief: {
                brief_id,
                idea_id,
                ...brief
            },
            rag: {
                query,
                results: ragMetadata.totalResults,
                averageSimilarity: ragMetadata.averageScore,
                highConfidenceCount: ragMetadata.highConfidenceResults,
                evidenceUsed: snippets.length
            }
        };
    });

    app.post('/:brief_id/approve', async (req: any) => {
        const { brief_id } = req.params;
        await logEvent({
            event_type: 'brief.approved',
            actor_id: (req as any).actor_id,
            actor_role: (req as any).actor_role,
            brief_id,
            request_id: (req as any).request_id,
            timezone: (req as any).timezone
        });
        return { ok: true };
    });
};
export default routes;
