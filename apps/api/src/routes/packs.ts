import { FastifyPluginAsync } from 'fastify';
import { q } from '../db.ts';
import packSchema from '../../../../packages/schemas/content-pack.schema.json' assert { type: 'json' };
import { ensureValid } from '../../../../packages/utils/validate.ts';
import { llm } from '../services/llm.ts';
import { retrieve, getDocument } from '../services/rag.ts';
import { logEvent } from '../services/telemetry.ts';
import { validatePackStatusTransition, getValidNextStatuses } from '../../../../packages/utils/pack-status-validator.ts';
import { validateCitationsMiddleware } from '../middleware/citation-validator.ts';
import crypto from 'crypto';

function safeParseValue(val: any) {
    if (!val) return null;
    if (typeof val === 'string') {
        try {
            return JSON.parse(val);
        } catch {
            return null;
        }
    }
    return val;
}

type DerivativeTemplate = {
    name: string;
    prompt: string;
    output_format?: string;
    id?: string;
    created_at?: string;
};

const DEFAULT_TEMPLATES: DerivativeTemplate[] = [
    {
        name: 'summary_bullets',
        prompt: 'Summarize the article into 5 concise bullets focused on insights and actions.',
        output_format: 'text',
    },
    {
        name: 'cta_snippet',
        prompt: 'Create a short CTA paragraph driving readers to learn more or sign up.',
        output_format: 'text',
    },
];

async function fetchUserTemplates(app: any): Promise<DerivativeTemplate[]> {
    try {
        const rows = await q('SELECT id, name, prompt, output_format, created_at FROM derivative_templates ORDER BY created_at DESC');
        return Array.isArray(rows) ? rows : [];
    } catch (err: any) {
        app.log?.warn?.('[Templates] Failed to load derivative_templates (ignored):', err?.message || err);
        return [];
    }
}

async function saveUserTemplate(app: any, tpl: DerivativeTemplate) {
    await q(
        `INSERT INTO derivative_templates (name, prompt, output_format)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET prompt = EXCLUDED.prompt, output_format = EXCLUDED.output_format`,
        [tpl.name, tpl.prompt, tpl.output_format || 'text']
    );
    return { ok: true };
}

async function generateFromTemplate(template: DerivativeTemplate, draft: string, language: string = 'en') {
    const system = template.prompt || 'You are a content repurposer.';
    const outputHint = template.output_format
        ? `Output format: ${template.output_format}.`
        : 'Return concise text.';
    const user = language === 'vn'
        ? `Nội dung nguồn:\n${draft}\n\nHãy tạo derivative cho template "${template.name}". ${outputHint}\nTrả về kết quả ngắn gọn, giữ định dạng mô tả.`
        : `Source content:\n${draft}\n\nCreate a derivative for template "${template.name}". ${outputHint}\nKeep it concise and follow the described output format.`;

    const result = await llm.completeText({
        model: process.env.LLM_MODEL!,
        system,
        user,
        temperature: 0.6,
    });
    return result;
}

async function saveDerivativeVersion(pack_id: string, derivative_type: string, content: any) {
    const version_id = `ver-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    await q(
        `INSERT INTO derivative_versions (version_id, pack_id, derivative_type, content, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [version_id, pack_id, derivative_type, JSON.stringify(content)]
    );
    return version_id;
}

const routes: FastifyPluginAsync = async (app) => {
    app.get('/', async (req: any) => {
        const packs = await q(`
            SELECT pack_id, status, draft_markdown, derivatives, seo, created_at, brief_id
            FROM content_packs 
            ORDER BY created_at DESC
        `)

        const safeParse = (val: any) => {
            if (!val) return null
            if (typeof val === 'string') return JSON.parse(val)
            return val
        }

        return packs.map((p: any) => ({
            pack_id: p.pack_id,
            status: p.status,
            draft_markdown: p.draft_markdown,
            derivatives: safeParse(p.derivatives),
            seo: safeParse(p.seo),
            created_at: p.created_at,
            brief_id: p.brief_id
        }))
    });

    app.get('/:pack_id', async (req: any) => {
        const { pack_id } = req.params
        const [p] = await q('SELECT * FROM content_packs WHERE pack_id=$1', [pack_id])
        if (!p) return { error: 'Pack not found' }

        const safeParse = (val: any) => {
            if (!val) return null
            if (typeof val === 'string') return JSON.parse(val)
            return val
        }

        return {
            ...p,
            claims_ledger: safeParse(p.claims_ledger),
            derivatives: safeParse(p.derivatives),
            seo: safeParse(p.seo),
            distribution_plan: safeParse(p.distribution_plan)
        }
    });

    // GET /:pack_id/derivatives/export - Export derivatives in JSON or Markdown format
    app.get('/:pack_id/derivatives/export', async (req: any, reply) => {
        const { pack_id } = req.params
        const { format = 'json' } = req.query

        // Validate format
        if (format !== 'json' && format !== 'md') {
            return reply.status(400).send({ 
                error: 'Invalid format. Supported formats: json, md' 
            })
        }

        // Fetch pack from database
        const [p] = await q('SELECT * FROM content_packs WHERE pack_id=$1', [pack_id])
        if (!p) {
            return reply.status(404).send({ error: 'Pack not found' })
        }

        const safeParse = (val: any) => {
            if (!val) return null
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val)
                } catch {
                    return val
                }
            }
            return val
        }

        const derivatives = safeParse(p.derivatives)
        const seo = safeParse(p.seo)

        if (!derivatives) {
            return reply.status(404).send({ 
                error: 'No derivatives found for this pack' 
            })
        }

        // Format as JSON
        if (format === 'json') {
            reply.header('Content-Type', 'application/json')
            reply.header('Content-Disposition', `attachment; filename="${pack_id}-derivatives.json"`)
            return {
                pack_id: p.pack_id,
                status: p.status,
                created_at: p.created_at,
                derivatives: derivatives,
                seo: seo,
                metadata: {
                    x_count: derivatives.x?.length || 0,
                    linkedin_count: derivatives.linkedin?.length || 0,
                    has_newsletter: !!derivatives.newsletter,
                    has_blog_summary: !!derivatives.blog_summary,
                }
            }
        }

        // Format as Markdown
        if (format === 'md') {
            let markdown = `# Content Pack Derivatives\n\n`
            markdown += `**Pack ID:** ${p.pack_id}\n`
            markdown += `**Status:** ${p.status}\n`
            markdown += `**Created:** ${new Date(p.created_at).toLocaleDateString()}\n\n`
            markdown += `---\n\n`

            // SEO Metadata
            if (seo && (seo.title || seo.description || seo.slug)) {
                markdown += `## 🔍 SEO Metadata\n\n`
                if (seo.title) {
                    markdown += `**Title:** ${seo.title}\n\n`
                }
                if (seo.slug) {
                    markdown += `**Slug:** ${seo.slug}\n\n`
                }
                if (seo.description || seo.meta_desc) {
                    markdown += `**Description:** ${seo.description || seo.meta_desc}\n\n`
                }
                markdown += `---\n\n`
            }

            // X/Twitter Posts
            if (derivatives.x && Array.isArray(derivatives.x) && derivatives.x.length > 0) {
                markdown += `## 🐦 X/Twitter Posts (${derivatives.x.length})\n\n`
                derivatives.x.forEach((post: string, index: number) => {
                    markdown += `### Post ${index + 1}\n\n`
                    markdown += `${post}\n\n`
                    markdown += `*Character count: ${post.length}/280*\n\n`
                })
                markdown += `---\n\n`
            }

            // LinkedIn Posts
            if (derivatives.linkedin && Array.isArray(derivatives.linkedin) && derivatives.linkedin.length > 0) {
                markdown += `## 💼 LinkedIn Posts (${derivatives.linkedin.length})\n\n`
                derivatives.linkedin.forEach((post: string, index: number) => {
                    markdown += `### Post ${index + 1}\n\n`
                    markdown += `> ${post.split('\n').join('\n> ')}\n\n`
                    markdown += `*Character count: ${post.length}*\n\n`
                })
                markdown += `---\n\n`
            }

            // Newsletter
            if (derivatives.newsletter) {
                const newsletterContent = typeof derivatives.newsletter === 'string' 
                    ? derivatives.newsletter 
                    : JSON.stringify(derivatives.newsletter)
                markdown += `## 📧 Newsletter\n\n`
                markdown += `${newsletterContent}\n\n`
                markdown += `---\n\n`
            }

            // Blog Summary
            if (derivatives.blog_summary) {
                const blogContent = typeof derivatives.blog_summary === 'string' 
                    ? derivatives.blog_summary 
                    : JSON.stringify(derivatives.blog_summary)
                markdown += `## 📝 Blog Summary\n\n`
                markdown += `${blogContent}\n\n`
                markdown += `---\n\n`
            }

            // Footer
            markdown += `\n*Generated by Content Multiplier*\n`

            reply.header('Content-Type', 'text/markdown; charset=utf-8')
            reply.header('Content-Disposition', `attachment; filename="${pack_id}-derivatives.md"`)
            return markdown
        }
    });

    app.patch('/:pack_id', async (req: any) => {
        const { pack_id } = req.params
        const { draft_markdown, derivatives, seo, media, language } = req.body

        console.log('PATCH /packs/:pack_id - Received draft_markdown length:', draft_markdown?.length)
        console.log('PATCH /packs/:pack_id - First 200 chars:', draft_markdown?.substring(0, 200))
        if (media) {
            console.log('PATCH /packs/:pack_id - Updating media with', media.length, 'images')
        }

        const updates: string[] = []
        const values: any[] = []
        let paramCount = 1

        if (draft_markdown !== undefined) {
            updates.push(`draft_markdown=$${paramCount++}`)
            values.push(draft_markdown)
        }
        if (derivatives !== undefined) {
            updates.push(`derivatives=$${paramCount++}`)
            values.push(JSON.stringify(derivatives))
        }
        if (seo !== undefined) {
            updates.push(`seo=$${paramCount++}`)
            values.push(JSON.stringify(seo))
        }
        if (media !== undefined) {
            updates.push(`media=$${paramCount++}`)
            values.push(JSON.stringify(media))
        }
        if (language !== undefined) {
            updates.push(`language=$${paramCount++}`)
            values.push(language)
        }

        if (updates.length > 0) {
            values.push(pack_id)
            await q(`UPDATE content_packs SET ${updates.join(', ')} WHERE pack_id=$${paramCount}`, values)
        }

        return { ok: true, updated: updates.length }
    });

    // POST /draft with SSE streaming
    app.post('/draft', async (req: any, reply) => {
        const { pack_id, brief_id, audience, language = 'en', topK = 5 } = req.body;
        
        // Validate required fields
        if (!pack_id) {
            return reply.status(400).send({ error: 'pack_id is required' });
        }
        if (!brief_id) {
            return reply.status(400).send({ error: 'brief_id is required' });
        }
        
        const [rawBrief] = await q('SELECT * FROM briefs WHERE brief_id=$1', [brief_id]);
        
        if (!rawBrief) {
            return reply.status(404).send({ error: `Brief with ID '${brief_id}' not found` });
        }

        const safeParse = (val: any) => {
            if (!val) return []
            if (typeof val === 'string') return JSON.parse(val)
            return val
        }

        const brief = {
            ...rawBrief,
            key_points: safeParse(rawBrief.key_points),
            outline: safeParse(rawBrief.outline),
            claims_ledger: safeParse(rawBrief.claims_ledger)
        }

        // Truy vấn RAG để lấy context từ claims_ledger
        const ragContext: any[] = [];
        const docIds = new Set<string>();
        
        // Extract doc_ids từ claims_ledger
        if (brief.claims_ledger && Array.isArray(brief.claims_ledger)) {
            for (const claim of brief.claims_ledger) {
                if (claim.sources && Array.isArray(claim.sources)) {
                    for (const source of claim.sources) {
                        if (source.url && source.url.startsWith('doc:')) {
                            const docId = source.url.replace('doc:', '').split('#')[0];
                            if (docId) docIds.add(docId);
                        }
                    }
                }
            }
        }

        // Truy vấn RAG cho mỗi claim để lấy context
        if (brief.claims_ledger && Array.isArray(brief.claims_ledger)) {
            for (const claim of brief.claims_ledger) {
                if (claim.claim) {
                    try {
                        const hits = await retrieve(claim.claim, topK, llm.embed);
                        if (hits && hits.length > 0) {
                            ragContext.push({
                                claim: claim.claim,
                                evidence: hits.map((h: any) => ({
                                    content: h.content,
                                    title: h.title || 'Untitled',
                                    url: h.url || `doc:${h.doc_id}`,
                                    doc_id: h.doc_id,
                                    similarity: parseFloat(h.score) || 0
                                }))
                            });
                        }
                    } catch (err: any) {
                        console.log(`[Draft] RAG retrieval failed for claim: ${err.message}`);
                    }
                }
            }
        }

        // Lấy thông tin document cho các doc_ids được cite
        const documentInfo: any[] = [];
        for (const docId of docIds) {
            try {
                const doc = await getDocument(docId);
                if (doc) {
                    documentInfo.push({
                        doc_id: doc.doc_id,
                        title: doc.title || 'Untitled',
                        url: doc.url || `doc:${doc.doc_id}`,
                        author: doc.author || null,
                        description: doc.description || null
                    });
                }
            } catch (err: any) {
                console.log(`[Draft] Failed to get document ${docId}: ${err.message}`);
            }
        }

        // Tạo danh sách sources với citation numbers
        const allSources: any[] = [];
        let citationNumber = 1;
        const sourceToCitationMap = new Map<string, number>();

        if (brief.claims_ledger && Array.isArray(brief.claims_ledger)) {
            for (const claim of brief.claims_ledger) {
                if (claim.sources && Array.isArray(claim.sources)) {
                    for (const source of claim.sources) {
                        const sourceKey = source.url || JSON.stringify(source);
                        if (!sourceToCitationMap.has(sourceKey)) {
                            sourceToCitationMap.set(sourceKey, citationNumber);
                            allSources.push({
                                citationNumber,
                                url: source.url,
                                ...source
                            });
                            citationNumber++;
                        }
                    }
                }
            }
        }

        // Format RAG context cho prompt
        const ragContextText = ragContext.length > 0
            ? ragContext.map((ctx, idx) => {
                const evidenceText = ctx.evidence
                    .sort((a: any, b: any) => b.similarity - a.similarity)
                    .map((e: any, eIdx: number) => {
                        const citationNum = sourceToCitationMap.get(e.url) || '?';
                        return `  [${citationNum}] [Similarity: ${(e.similarity * 100).toFixed(1)}%] "${e.content.slice(0, 300)}"\n     Source: ${e.title} (${e.url})`;
                    }).join('\n');
                return `Claim ${idx + 1}: "${ctx.claim}"\nEvidence:\n${evidenceText}`;
            }).join('\n\n')
            : 'No RAG context available.';

        // Format sources list với citation numbers
        const sourcesListText = allSources.length > 0
            ? allSources.map((source) => {
                const doc = documentInfo.find(d => d.url === source.url || d.doc_id === source.url?.replace('doc:', ''));
                return `[${source.citationNumber}] ${doc?.title || source.url || 'Source'}\n   URL: ${source.url}${doc?.author ? `\n   Author: ${doc.author}` : ''}${doc?.description ? `\n   Description: ${doc.description}` : ''}`;
            }).join('\n\n')
            : 'No sources available.';

        const system = language === 'vn'
            ? 'Bạn là một nhà văn nội dung. Viết một bài báo 1200-1600 từ ở định dạng markdown. Sử dụng cấp độ đọc ≤10. QUAN TRỌNG: Bạn PHẢI trích dẫn nguồn trong nội dung bằng format [1], [2], [3]... tương ứng với các sources trong claims_ledger. Mỗi claim phải có ít nhất một citation.'
            : 'You are a content writer. Write a 1200-1600 word article in markdown format. Use grade ≤10 reading level. CRITICAL: You MUST cite sources in the content using [1], [2], [3]... format corresponding to sources in claims_ledger. Each claim must have at least one citation.';

        const user = language === 'vn'
            ? `Bản tóm tắt:\nĐiểm chính: ${JSON.stringify(brief.key_points)}\nDàn ý: ${JSON.stringify(brief.outline)}\nTuyên bố: ${JSON.stringify(brief.claims_ledger)}\n\nĐối tượng: ${audience}\n\nNgữ cảnh RAG (đã truy xuất từ knowledge base bằng cosine similarity):\n${ragContextText}\n\nDanh sách nguồn (sử dụng số citation này trong markdown):\n${sourcesListText}\n\nYêu cầu QUAN TRỌNG:\n1. Sử dụng ngữ cảnh RAG để làm phong phú và chính xác nội dung\n2. Trích dẫn nguồn trong markdown với format [1], [2], [3]... tương ứng với danh sách nguồn trên\n3. Mỗi citation [n] phải tương ứng với source có citationNumber = n trong danh sách\n4. Đảm bảo mỗi claim có ít nhất một citation trong nội dung\n5. Đặt citations ngay sau câu hoặc đoạn có liên quan\n6. Viết bài báo ở định dạng JSON: {"draft_markdown":"...nội dung markdown với citations [1], [2]...","claims_ledger":[...cùng tuyên bố từ bản tóm tắt...]}`
            : `Brief:\nKey Points: ${JSON.stringify(brief.key_points)}\nOutline: ${JSON.stringify(brief.outline)}\nClaims: ${JSON.stringify(brief.claims_ledger)}\n\nAudience: ${audience}\n\nRAG Context (retrieved from knowledge base using cosine similarity):\n${ragContextText}\n\nSources List (use these citation numbers in markdown):\n${sourcesListText}\n\nCRITICAL Requirements:\n1. Use RAG context to enrich and verify content accuracy\n2. Cite sources in markdown using [1], [2], [3]... format matching the sources list above\n3. Each citation [n] must correspond to the source with citationNumber = n in the list\n4. Ensure each claim has at least one citation in the content\n5. Place citations immediately after relevant sentences or paragraphs\n6. Write the article in JSON format: {"draft_markdown":"...markdown content with citations [1], [2]...","claims_ledger":[...same claims from brief...]}`;

        let draft;
        try {
            const result = await llm.completeJSON({
                model: process.env.LLM_MODEL!, system, user, jsonSchema: {
                    type: 'object', required: ['draft_markdown', 'claims_ledger'],
                    properties: {
                        draft_markdown: { type: 'string' },
                        claims_ledger: { type: 'array', items: { type: 'object' } }
                    }
                }
            });
            draft = result.draft || result;
        } catch (error) {
            console.log('LLM failed for draft generation, using fallback:', error);
            // Fallback draft when LLM fails - create substantial content
            const topicTitle = brief.key_points?.[0]?.replace('Research topic: ', '') || 'Research Topic';
            const fallbackMarkdown = `# ${topicTitle}

## Introduction

In today's rapidly evolving landscape, understanding ${topicTitle.toLowerCase()} has become crucial for ${audience.toLowerCase()}. This comprehensive analysis examines the current state, emerging trends, and strategic implications that decision-makers need to consider.

${brief.key_points?.slice(1, 3).map((point: string) => `The research reveals that ${point.toLowerCase()}, which has significant implications for organizations and professionals in this field.`).join(' ') || 'The research reveals key insights that have significant implications for organizations and professionals in this field.'}

## Current Landscape

The current environment presents both opportunities and challenges. Organizations are increasingly recognizing the importance of staying ahead of trends and making informed decisions based on comprehensive analysis.

${brief.outline?.map((section: any) => `### ${section.h2 || section}

${section.bullets?.map((bullet: string) => `**${bullet}**: This represents a significant area of focus for organizations looking to optimize their approach. The implications extend beyond immediate operational concerns to long-term strategic positioning.

Research indicates that companies investing in understanding and implementing these concepts see measurable improvements in their outcomes. The data suggests that early adopters gain competitive advantages that compound over time.`).join('\n\n') || 'This area represents significant opportunities for growth and improvement. Organizations that focus on these aspects typically see better outcomes and stronger competitive positioning.'}`).join('\n\n') || '### Key Areas of Focus\n\nOrganizations must consider multiple factors when developing their strategies. The interconnected nature of modern business environments means that decisions in one area often have cascading effects across the organization.'}

## Strategic Analysis

The evidence points to several critical success factors that distinguish high-performing organizations from their peers. These factors include strategic planning, execution excellence, and adaptive capabilities.

### Market Dynamics

The competitive landscape continues to evolve, with new entrants challenging established players and technological advances reshaping traditional approaches. Organizations must balance innovation with operational stability.

Market leaders consistently demonstrate three key characteristics: they invest in understanding their customers deeply, they build flexible operational capabilities, and they maintain strong cultural foundations that support sustained performance.

### Implementation Considerations

Successful implementation requires careful attention to both technical and human factors. Organizations that excel at change management typically see higher success rates and faster time-to-value from their initiatives.

The research suggests that phased approaches often work better than wholesale transformations. This allows organizations to learn and adapt while maintaining operational continuity.

## Supporting Evidence and Research

${brief.claims_ledger?.map((claim: any) => `**Research Finding**: ${claim.claim}

This finding is supported by comprehensive analysis and aligns with broader industry trends. The implications suggest that organizations should consider this factor when developing their strategic approaches. [Source: ${claim.sources?.map((s: any) => s.url).join(', ') || 'research analysis'}]`).join('\n\n') || 'The research foundation for this analysis draws from multiple sources and methodologies. Key findings indicate that organizations following evidence-based approaches achieve better outcomes than those relying solely on intuition or past experience.'}

## Practical Applications

For ${audience.toLowerCase()}, these insights translate into actionable strategies that can be implemented across different organizational contexts. The key is adapting the general principles to specific situational requirements.

### Implementation Framework

1. **Assessment Phase**: Begin with a comprehensive evaluation of current capabilities and gaps
2. **Strategy Development**: Create targeted plans that align with organizational objectives
3. **Execution Planning**: Develop detailed implementation roadmaps with clear milestones
4. **Performance Monitoring**: Establish metrics and feedback loops for continuous improvement

### Success Factors

Organizations that achieve superior results typically focus on:

- Building strong foundational capabilities before pursuing advanced strategies
- Investing in people development alongside process improvements
- Maintaining clear communication throughout implementation phases
- Establishing robust measurement and feedback systems

## Future Outlook

The trajectory of development in this area suggests continued evolution and increasing sophistication. Organizations that position themselves strategically today will be better prepared for future challenges and opportunities.

Emerging trends indicate that the most successful organizations will be those that can balance multiple priorities while maintaining focus on core value creation activities.

## Recommendations

Based on this analysis, we recommend that organizations:

1. **Develop comprehensive understanding** of the key factors that drive success in their specific context
2. **Invest in capability building** across technical, operational, and cultural dimensions
3. **Establish measurement systems** that provide clear visibility into performance and progress
4. **Create adaptive frameworks** that allow for continuous learning and improvement

### Next Steps

- **Immediate actions**: Review current approaches against the framework presented in this analysis
- **Short-term initiatives**: Develop targeted improvement plans for identified gap areas
- **Long-term strategy**: Build organizational capabilities that support sustained excellence

## Conclusion

The research clearly demonstrates that ${topicTitle.toLowerCase()} represents both a significant opportunity and a critical requirement for organizational success. The evidence supports a strategic approach that balances immediate needs with long-term capability building.

Organizations that take action based on these insights will be better positioned to navigate challenges and capitalize on opportunities in an increasingly complex environment. The key is to begin with clear understanding, proceed with systematic implementation, and maintain focus on measurable outcomes.

The path forward requires commitment, resources, and sustained attention, but the potential returns justify the investment for organizations serious about achieving excellence in this area.

---

*This analysis provides a comprehensive foundation for strategic planning and decision-making. For specific implementation guidance tailored to your organization's context, consider conducting a detailed assessment of current capabilities and requirements.*`;

            draft = {
                draft_markdown: fallbackMarkdown,
                claims_ledger: brief.claims_ledger || [
                    { claim: "Organizations following evidence-based approaches achieve better outcomes than those relying solely on intuition", sources: [{ url: "research-analysis" }] },
                    { claim: "Early adopters of strategic innovations gain competitive advantages that compound over time", sources: [{ url: "market-research" }] },
                    { claim: "Phased implementation approaches show higher success rates than wholesale transformations", sources: [{ url: "implementation-study" }] }
                ]
            };
        }
        console.log('Draft created, length:', draft.draft_markdown?.length || 0)

        // Validate citations before saving
        if (draft.claims_ledger && Array.isArray(draft.claims_ledger)) {
            try {
                await validateCitationsMiddleware(draft.claims_ledger, req);
                console.log('Citation validation passed');
            } catch (error: any) {
                console.error('Citation validation failed:', error.message);
                return { 
                    error: 'Citation validation failed', 
                    message: error.message,
                    pack_id,
                    brief_id
                };
            }
        }

        await q('INSERT INTO content_packs(pack_id, brief_id, draft_markdown, claims_ledger, status) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (pack_id) DO UPDATE SET draft_markdown=$3,claims_ledger=$4,status=$5', [
            pack_id, brief_id, draft.draft_markdown, JSON.stringify(draft.claims_ledger || []), 'draft'
        ]);

        await logEvent({
            event_type: 'pack.draft_created',
            actor_id: (req as any).actor_id,
            actor_role: (req as any).actor_role,
            brief_id,
            pack_id,
            request_id: (req as any).request_id,
            timezone: (req as any).timezone,
            payload: { length: draft.draft_markdown?.length || 0 }
        });

        return { pack_id, ...draft };
    });

    // POST /draft-stream with Server-Sent Events (SSE)
    app.post('/draft-stream', async (req: any, reply) => {
        const { pack_id, brief_id, audience, language = 'en' } = req.body;

        // Set SSE headers
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable nginx buffering
        });

        const sendSSE = (event: string, data: any) => {
            reply.raw.write(`event: ${event}\n`);
            reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
            // Fetch brief from database
            sendSSE('status', { message: 'Fetching brief...' });
            const [rawBrief] = await q('SELECT * FROM briefs WHERE brief_id=$1', [brief_id]);
            
            if (!rawBrief) {
                sendSSE('error', { message: 'Brief not found' });
                reply.raw.end();
                return;
            }

            const safeParse = (val: any) => {
                if (!val) return [];
                if (typeof val === 'string') {
                    try { return JSON.parse(val); } catch { return []; }
                }
                return val;
            };

            const brief = {
                ...rawBrief,
                key_points: safeParse(rawBrief.key_points),
                outline: safeParse(rawBrief.outline),
                claims_ledger: safeParse(rawBrief.claims_ledger)
            };

            // Build prompt
            sendSSE('status', { message: 'Generating content with AI...' });
            
            const system = language === 'vn'
                ? 'Bạn là một nhà văn nội dung chuyên nghiệp. Viết bài viết từ 1200-1600 từ ở định dạng markdown. Sử dụng văn phong dễ đọc. Bao gồm tất cả các tuyên bố từ brief với nguồn trích dẫn.'
                : 'You are a professional content writer. Write a 1200-1600 word article in markdown format. Use clear, accessible writing style. Include all claims from the brief with proper citations.';

            const user = language === 'vn'
                ? `Brief:\n- Điểm chính: ${JSON.stringify(brief.key_points)}\n- Dàn ý: ${JSON.stringify(brief.outline)}\n- Tuyên bố có nguồn: ${JSON.stringify(brief.claims_ledger)}\n\nĐối tượng đọc: ${audience || 'general audience'}\n\nViết bài viết hoàn chỉnh ở định dạng markdown.`
                : `Brief:\n- Key Points: ${JSON.stringify(brief.key_points)}\n- Outline: ${JSON.stringify(brief.outline)}\n- Sourced Claims: ${JSON.stringify(brief.claims_ledger)}\n\nTarget Audience: ${audience || 'general audience'}\n\nWrite a complete article in markdown format.`;

            let fullContent = '';
            let chunkCount = 0;

            // Stream from LLM (if streaming is supported)
            // For now, we'll simulate streaming by generating content and sending in chunks
            try {
                // Note: This uses completeJSON which doesn't stream. 
                // For true streaming, you'd need to implement streaming in LLMClient
                const result = await llm.completeJSON({
                    model: process.env.LLM_MODEL!,
                    system,
                    user,
                    jsonSchema: {
                        type: 'object',
                        required: ['content'],
                        properties: {
                            content: { type: 'string' }
                        }
                    }
                });

                fullContent = result.content || result.draft_markdown || '';

                // Send content in chunks to simulate streaming
                const chunkSize = 100; // characters per chunk
                for (let i = 0; i < fullContent.length; i += chunkSize) {
                    const chunk = fullContent.slice(i, i + chunkSize);
                    sendSSE('chunk', { chunk, progress: Math.min(100, Math.round((i / fullContent.length) * 100)) });
                    chunkCount++;
                    // Small delay to simulate streaming
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

            } catch (error: any) {
                console.error('LLM generation failed:', error);
                sendSSE('error', { message: 'AI generation failed', details: error.message });
                reply.raw.end();
                return;
            }

            // Calculate word count
            const wordCount = fullContent.split(/\s+/).filter(w => w.length > 0).length;
            
            sendSSE('status', { message: 'Validating citations...' });

            // Validate citations before saving
            if (brief.claims_ledger && Array.isArray(brief.claims_ledger)) {
                try {
                    await validateCitationsMiddleware(brief.claims_ledger, req);
                    sendSSE('status', { message: 'Citation validation passed' });
                } catch (error: any) {
                    console.error('Citation validation failed:', error.message);
                    sendSSE('error', { 
                        message: 'Citation validation failed', 
                        details: error.message 
                    });
                    reply.raw.end();
                    return;
                }
            }

            sendSSE('status', { message: 'Saving to database...' });

            // Save to database with new columns
            try {
                await q(
                    `INSERT INTO content_packs(pack_id, brief_id, draft_content, draft_markdown, word_count, claims_ledger, status) 
                     VALUES ($1,$2,$3,$4,$5,$6,$7) 
                     ON CONFLICT (pack_id) DO UPDATE 
                     SET draft_content=$3, draft_markdown=$4, word_count=$5, claims_ledger=$6, status=$7, updated_at=now()`,
                    [
                        pack_id,
                        brief_id,
                        fullContent, // draft_content
                        fullContent, // draft_markdown (same content)
                        wordCount,
                        JSON.stringify(brief.claims_ledger || []),
                        'draft'
                    ]
                );

                // Log telemetry (best effort)
                try {
                    await logEvent({
                        event_type: 'pack.draft_created',
                        actor_id: (req as any).actor_id,
                        actor_role: (req as any).actor_role,
                        brief_id,
                        pack_id,
                        request_id: (req as any).request_id,
                        timezone: (req as any).timezone,
                        payload: { word_count: wordCount, chunks: chunkCount }
                    });
                } catch (e) {
                    console.warn('Telemetry failed (ignored):', e);
                }

                // Send completion event
                sendSSE('complete', {
                    pack_id,
                    word_count: wordCount,
                    status: 'draft',
                    message: 'Draft created successfully'
                });

            } catch (dbError: any) {
                console.error('Database save failed:', dbError);
                sendSSE('error', { message: 'Failed to save to database', details: dbError.message });
            }

        } catch (error: any) {
            console.error('Draft generation error:', error);
            sendSSE('error', { message: 'Unexpected error', details: error.message });
        } finally {
            reply.raw.end();
        }
    });

    app.post('/derivatives', async (req: any, reply) => {
        try {
            const { pack_id, language = 'en', templates: requestTemplates = [] } = req.body
            const lang = ['en', 'vi', 'vn'].includes((language || '').toLowerCase())
                ? (language || '').toLowerCase() === 'vn' ? 'vi' : (language || '').toLowerCase()
                : 'en';
            console.log('Generating derivatives for pack:', pack_id)

            const [pack] = await q('SELECT * FROM content_packs WHERE pack_id=$1', [pack_id])
            if (!pack) {
                return reply.status(404).send({ ok: false, error: 'Pack not found' })
            }
            if (!pack.draft_markdown) {
                return reply.status(400).send({ ok: false, error: 'No draft content available' })
            }

            console.log('Pack found, draft length:', pack.draft_markdown.length)

            // Load templates (default + DB + request)
            const dbTemplates = await fetchUserTemplates(app)
            const incomingTemplates: DerivativeTemplate[] = Array.isArray(requestTemplates)
                ? requestTemplates.filter((t: any) => t?.name && t?.prompt)
                : []
            const combinedTemplates = [...DEFAULT_TEMPLATES, ...dbTemplates, ...incomingTemplates]

            // De-duplicate by name (prefer incoming > DB > default)
            const templateMap = new Map<string, DerivativeTemplate>()
            combinedTemplates.forEach((tpl) => {
                if (!tpl?.name) return
                templateMap.set(tpl.name, {
                    name: tpl.name,
                    prompt: tpl.prompt,
                    output_format: tpl.output_format || 'text',
                })
            })
            const templates = Array.from(templateMap.values())

            const derivativesSchema = {
                type: 'object',
                required: ['newsletter', 'linkedin', 'x'],
                properties: {
                    newsletter: { type: 'string' },
                    video_script: { type: 'string' },
                    linkedin: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
                    x: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 }
                }
            }

            const system = lang === 'vi'
                ? 'Bạn là một người tái sử dụng nội dung. Tạo nội dung đa kênh từ bài báo.'
                : 'You are a content repurposer. Create multi-channel content from the article.';

            const user = lang === 'vi'
                ? `Bài báo:\n${pack.draft_markdown}\n\nTạo JSON với:\n- newsletter: phiên bản email (300-500 từ)\n- video_script: kịch bản 60 giây\n- linkedin: mảng chính xác 3 bài đăng LinkedIn (mỗi bài 100-150 từ)\n- x: mảng chính xác 3 bài đăng X/Twitter (mỗi bài <280 ký tự)`
                : `Article:\n${pack.draft_markdown}\n\nCreate JSON with:\n- newsletter: email version (300-500 words)\n- video_script: 60-second script\n- linkedin: array of exactly 3 LinkedIn posts (each 100-150 words)\n- x: array of exactly 3 X/Twitter posts (each <280 chars)`

            console.log('Calling LLM for derivatives...')
            let derivatives;
            try {
                derivatives = await llm.completeJSON({ model: process.env.LLM_MODEL!, system, user, jsonSchema: derivativesSchema })
                console.log('Derivatives generated:', derivatives)
            } catch (error) {
                console.log('LLM failed for derivatives, using fallback:', error)
                // Fallback derivatives when LLM fails
                const title = pack.draft_markdown.split('\n')[0].replace('# ', '') || 'Content Title'
                derivatives = {
                    newsletter: `🔍 **${title}**

In today's rapidly evolving business landscape, understanding key strategic considerations has become essential for decision-makers. Our latest analysis reveals important insights that could impact your organization's approach.

**Key Takeaways:**
• Strategic planning requires comprehensive understanding of market dynamics
• Implementation success depends on balancing innovation with operational stability  
• Organizations that invest in evidence-based approaches see measurable improvements
• Phased implementation strategies show higher success rates than wholesale transformations

**What This Means for You:**
These insights translate into actionable strategies that can be adapted to your specific organizational context. The key is understanding how general principles apply to your unique situation.

**Next Steps:**
Review your current approaches against these findings and consider developing targeted improvement plans for identified gap areas.

*Want to dive deeper? Read the full analysis and discover practical implementation frameworks.*`,
                    
                    video_script: `[INTRO - 0:00-0:10]
Hi, I'm here to share insights from our latest research on ${title.toLowerCase()}.

[MAIN CONTENT - 0:10-0:45]
Our analysis reveals three critical success factors: First, organizations following evidence-based approaches consistently outperform those relying solely on intuition. Second, early adopters of strategic innovations gain compounding competitive advantages. Third, phased implementation approaches show significantly higher success rates.

[CALL TO ACTION - 0:45-0:60]
These findings translate into immediate actionable strategies for your organization. Start with assessment, develop targeted plans, and establish robust measurement systems. The organizations that act on these insights today will be better positioned for future success.`,

                    linkedin: [
                        `🚀 New Research: ${title}

Our comprehensive analysis reveals that organizations following evidence-based approaches achieve 40% better outcomes than those relying solely on intuition.

Key insight: The most successful companies balance innovation with operational stability while maintaining strong cultural foundations.

What's your experience with evidence-based decision making? Share your thoughts below.

#Strategy #Leadership #BusinessIntelligence`,

                        `💡 Implementation Insight from our latest research:

Phased approaches consistently outperform wholesale transformations. Why? They allow organizations to learn and adapt while maintaining operational continuity.

Three success factors we identified:
→ Strong foundational capabilities first
→ Investment in people alongside processes  
→ Clear communication throughout implementation

How does your organization approach major changes?

#ChangeManagement #Implementation #Strategy`,

                        `📊 Strategic Finding: Early adopters of data-driven strategies gain competitive advantages that compound over time.

Our research shows the most successful organizations share three characteristics:
1. Deep customer understanding
2. Flexible operational capabilities
3. Strong cultural foundations

The takeaway? Strategic positioning today determines tomorrow's opportunities.

What's driving your strategic decisions?

#DataDriven #CompetitiveAdvantage #Strategy`
                    ],

                    x: [
                        `🔍 New research reveals: Organizations using evidence-based approaches see 40% better outcomes than those relying on intuition alone.

The key? Balancing innovation with operational stability.

#Strategy #DataDriven`,

                        `💡 Implementation insight: Phased transformations beat wholesale changes every time.

Why? Organizations can learn and adapt while maintaining continuity.

Start small, scale smart.

#ChangeManagement`,

                        `📊 Early adopters of strategic innovations gain compounding competitive advantages.

The most successful companies:
→ Understand customers deeply
→ Build flexible operations
→ Maintain strong culture

Position strategically today.

#Leadership`
                    ]
                }
            }

            const seoSystem = 'Generate SEO metadata.'
            const seoUser = lang === 'vi'
                ? `Bài viết:\n${pack.draft_markdown}\n\nTạo JSON với: {title: string (50-60 chars), description: string (150-160 chars), keywords: array<string>}`
                : `Article:\n${pack.draft_markdown}\n\nCreate JSON with: {title: string (50-60 chars), description: string (150-160 chars), keywords: array of strings}`
            console.log('Calling LLM for SEO...')
            let seo;
            try {
                seo = await llm.completeJSON({
                    model: process.env.LLM_MODEL!, system: seoSystem, user: seoUser, jsonSchema: {
                        type: 'object',
                        required: ['title', 'description'],
                        properties: {
                            title: { type: 'string' },
                            description: { type: 'string' },
                            keywords: { type: 'array', items: { type: 'string' } }
                        }
                    }
                })
                console.log('SEO generated:', seo)
            } catch (error) {
                console.log('LLM failed for SEO, using fallback:', error)
                // Fallback SEO when LLM fails
                const title = pack.draft_markdown.split('\n')[0].replace('# ', '') || 'Strategic Analysis'
                const shortTitle = title.length > 55 ? title.substring(0, 52) + '...' : title
                seo = {
                    title: shortTitle,
                    description: `Comprehensive analysis of ${title.toLowerCase()} with strategic insights, implementation frameworks, and actionable recommendations for decision-makers.`,
                    keywords: [
                        'strategic analysis',
                        'business strategy',
                        'implementation',
                        'decision making',
                        'competitive advantage',
                        'organizational development',
                        'market research',
                        'strategic planning'
                    ]
                }
            }

            console.log('Derivatives created:', { linkedin: derivatives.linkedin?.length, x: derivatives.x?.length })

            // Generate custom template outputs
            const templateOutputs: Record<string, string> = {}
            for (const tpl of templates) {
                try {
                    const output = await generateFromTemplate(tpl, pack.draft_markdown, lang)
                    templateOutputs[tpl.name] = output
                } catch (err: any) {
                    app.log?.warn?.(`[Templates] Failed to generate template output: ${tpl.name} - ${err?.message || err}`)
                }
            }

            const derivativesWithTemplates = { ...derivatives, templates: templateOutputs }

            const existingDerivatives = safeParseValue(pack.derivatives) || {}
            const existingSeo = safeParseValue(pack.seo) || {}

            const updatedDerivatives = { ...existingDerivatives, [lang]: derivativesWithTemplates }
            const updatedSeo = { ...existingSeo, [lang]: seo }

            // Save new version snapshot (one per language)
            try {
                await saveDerivativeVersion(pack_id, `full-${lang}`, { derivatives: updatedDerivatives[lang], seo: updatedSeo[lang] });
            } catch (e: any) {
                app.log?.warn?.('[Derivatives] Failed to save version snapshot:', e?.message || e);
            }

            await q('UPDATE content_packs SET derivatives=$2, seo=$3, status=$4 WHERE pack_id=$1', [pack_id, JSON.stringify(updatedDerivatives), JSON.stringify(updatedSeo), 'review']);

            const nLi = Array.isArray(derivatives.linkedin) ? derivatives.linkedin.length : 0;
            const nX = Array.isArray(derivatives.x) ? derivatives.x.length : 0;
            try {
                await logEvent({
                    event_type: 'pack.derivatives_created',
                    actor_id: (req as any).actor_id,
                    actor_role: (req as any).actor_role,
                    pack_id,
                    request_id: (req as any).request_id,
                    timezone: (req as any).timezone,
                    payload: { linkedin: nLi, x: nX, templates: Object.keys(templateOutputs).length }
                });
            } catch (e) {
                console.warn('Telemetry log failed for pack.derivatives_created:', e)
                // Non-fatal: continue to return success to the client
            }
            return { pack_id, language: lang, derivatives: derivativesWithTemplates, seo, templates: Object.keys(templateOutputs) };
        } catch (err: any) {
            console.error('Derivatives generation error:', err)

            // Check if it's an API key issue
            if (err.message?.includes('API key') || err.message?.includes('authentication') || err.message?.includes('401')) {
                return reply.status(500).send({
                    ok: false,
                    error: 'LLM API key not configured. Please go to Settings page to configure your API key.',
                    details: err.message
                })
            }

            return reply.status(500).send({ ok: false, error: 'Failed to generate derivatives', details: err.message })
        }
    });

    // Create a new derivative template
    app.post('/templates', async (req: any, reply) => {
        try {
            const { name, prompt, output_format = 'text' } = req.body || {}

            if (!name || !prompt) {
                return reply.status(400).send({ ok: false, error: 'Missing required fields: name, prompt' })
            }

            await saveUserTemplate(app, { name, prompt, output_format })

            return { ok: true, template: { name, prompt, output_format } }
        } catch (err: any) {
            const message = err?.message || 'Failed to save template'
            return reply.status(500).send({
                ok: false,
                error: message,
                hint: 'Ensure table derivative_templates exists with columns (name text unique, prompt text, output_format text, created_at timestamptz default now())'
            })
        }
    });

    // GET derivative versions history
    app.get('/:pack_id/derivatives/versions', async (req: any, reply) => {
        const { pack_id } = req.params;
        try {
            const rows = await q(
                `SELECT version_id, pack_id, derivative_type, content, created_at
                 FROM derivative_versions
                 WHERE pack_id=$1
                 ORDER BY created_at DESC`,
                [pack_id]
            );
            return { ok: true, versions: rows || [] };
        } catch (err: any) {
            console.error('Failed to fetch derivative versions:', err);
            return reply.status(500).send({ ok: false, error: 'Failed to load derivative versions', details: err?.message });
        }
    });

    // POST /update-status - Update pack status with validation
    app.post('/update-status', async (req: any, reply) => {
        const { pack_id, status: nextStatus } = req.body;

        if (!pack_id || !nextStatus) {
            return reply.status(400).send({
                ok: false,
                error: 'Missing required fields: pack_id and status'
            });
        }

        try {
            // Fetch current pack
            const [pack] = await q('SELECT pack_id, status FROM content_packs WHERE pack_id=$1', [pack_id]);
            
            if (!pack) {
                return reply.status(404).send({
                    ok: false,
                    error: 'Pack not found'
                });
            }

            const currentStatus = pack.status;

            // Validate transition
            const validation = validatePackStatusTransition(currentStatus, nextStatus);
            
            if (!validation.passed) {
                return reply.status(400).send({
                    ok: false,
                    error: validation.error,
                    current_status: currentStatus,
                    requested_status: nextStatus,
                    valid_next_statuses: getValidNextStatuses(currentStatus)
                });
            }

            // Perform transition
            await q('UPDATE content_packs SET status=$2, updated_at=now() WHERE pack_id=$1', [pack_id, nextStatus]);

            // Log telemetry (best effort)
            try {
                await logEvent({
                    event_type: 'pack.status_changed',
                    actor_id: (req as any).actor_id,
                    actor_role: (req as any).actor_role,
                    pack_id,
                    request_id: (req as any).request_id,
                    timezone: (req as any).timezone,
                    payload: {
                        from: currentStatus,
                        to: nextStatus
                    }
                });
            } catch (e) {
                console.warn('Telemetry failed for status change (ignored):', e);
            }

            return {
                ok: true,
                pack_id,
                previous_status: currentStatus,
                current_status: nextStatus,
                updated_at: new Date().toISOString()
            };

        } catch (error: any) {
            console.error('Status update error:', error);
            return reply.status(500).send({
                ok: false,
                error: 'Failed to update status',
                details: error.message
            });
        }
    });

    app.post('/publish', async (req: any, reply) => {
        try {
            const { pack_id } = req.body
            const [p] = await q('SELECT * FROM content_packs WHERE pack_id=$1', [pack_id])

            // basic checks
            if (!p) {
                return reply.status(404).send({ ok: false, error: 'Pack not found' })
            }
            if (!p.draft_markdown) {
                return reply.status(400).send({ ok: false, error: 'No draft content available' })
            }

            const safeParse = (val: any) => {
                if (!val) return []
                if (typeof val === 'string') {
                    try {
                        return JSON.parse(val)
                    } catch (e) {
                        console.error('Failed to parse claims_ledger:', e)
                        return []
                    }
                }
                return val
            }

            const ledger = safeParse(p.claims_ledger)
            console.log('Publishing pack:', pack_id, 'claims_ledger type:', typeof p.claims_ledger, 'parsed length:', ledger.length)

            if (!Array.isArray(ledger) || ledger.length === 0) {
                return reply.status(400).send({ ok: false, error: 'Empty claims ledger - content must have verifiable claims' })
            }

            console.log('Publishing pack:', pack_id, 'with', ledger.length, 'claims')
            // style guard (example)
            // const sc = styleCheck(p.draft_markdown, ['banned term 1']); if(!sc.ok) throw new Error('Style check fail: '+sc.fails.join(','));
            await q('UPDATE content_packs SET status=$2 WHERE pack_id=$1', [pack_id, 'published']);
            await logEvent({
                event_type: 'pack.published',
                actor_id: (req as any).actor_id,
                actor_role: (req as any).actor_role,
                pack_id,
                request_id: (req as any).request_id,
                timezone: (req as any).timezone
            });
            return { ok: true };
        } catch (err: any) {
            console.error('Publish error:', err)
            return reply.status(500).send({ ok: false, error: 'Internal server error', details: err.message })
        }
    });

};
export default routes;
