/**
 * IDEA GENERATOR SERVICE
 * 
 * Service để sinh ra content ideas từ AI dựa trên persona và industry
 * Sử dụng AI Client mới với retry mechanism
 */

import { AIClient } from '../../../../packages/utils/ai-client';
import { loadLLMSettings } from './settingsStore';
import ideaSchema from '../../../../packages/schemas/idea.schema.json' assert { type: 'json' };
import { randomUUID } from 'crypto';

// ============================================
// TYPES
// ============================================

export interface GenerateIdeasRequest {
    persona: string;          // Đối tượng khách hàng (ví dụ: "Content Marketing Manager")
    industry: string;         // Ngành nghề (ví dụ: "SaaS", "E-commerce")
    corpus_hints?: string;    // Gợi ý thêm (ví dụ: "AI, automation, productivity")
    language?: 'en' | 'vn';   // Ngôn ngữ
    count?: number;           // Số lượng ý tưởng (mặc định 10)
    temperature?: number;     // Độ sáng tạo (mặc định 0.8)
}

export interface ContentIdea {
    idea_id: string;
    one_liner: string;
    angle?: string;
    personas: string[];
    why_now: string[];
    evidence: Array<{
        title?: string;
        url: string;
        quote: string;
    }>;
    scores: {
        novelty: number;      // 0-5
        demand: number;       // 0-5
        fit: number;          // 0-5
        white_space: number;  // 0-5
    };
    status: 'proposed' | 'selected' | 'discarded';
    tags?: string[];
}

export interface GenerateIdeasResponse {
    ideas: ContentIdea[];
    metadata: {
        provider: string;
        model: string;
        tokensUsed?: {
            prompt: number;
            completion: number;
            total: number;
        };
        temperature: number;
        durationMs: number;
    };
}

// ============================================
// PROMPT TEMPLATES
// ============================================

const SYSTEM_PROMPTS = {
    en: `You are an expert content strategist with deep knowledge of digital marketing, audience psychology, and content trends.

Your goal is to generate innovative, data-driven content ideas that:
- Resonate with the target audience
- Address current trends and pain points
- Have viral potential and engagement value
- Are backed by research and evidence
- Fill gaps in the market (white space)

Guidelines:
- Be specific and actionable
- Focus on unique angles and perspectives
- Consider timing and relevance (why now?)
- Provide credible evidence sources
- Rate each idea objectively across multiple dimensions`,

    vn: `Bạn là một chiến lược gia nội dung chuyên nghiệp với kiến thức sâu về marketing số, tâm lý khán giả và xu hướng nội dung.

Mục tiêu của bạn là tạo ra các ý tưởng nội dung sáng tạo, dựa trên dữ liệu:
- Phù hợp với đối tượng mục tiêu
- Giải quyết xu hướng và vấn đề hiện tại
- Có tiềm năng viral và thu hút tương tác
- Được hỗ trợ bởi nghiên cứu và bằng chứng
- Lấp đầy khoảng trống trên thị trường

Hướng dẫn:
- Cụ thể và có thể thực hiện
- Tập trung vào góc nhìn độc đáo
- Xem xét thời điểm và tính liên quan (tại sao bây giờ?)
- Cung cấp nguồn bằng chứng đáng tin
- Đánh giá mỗi ý tưởng một cách khách quan`
};

function buildPrompt(request: GenerateIdeasRequest): string {
    const { persona, industry, corpus_hints, language = 'en', count = 10 } = request;
    
    if (language === 'vn') {
        return `Tạo ra chính xác ${count} ý tưởng nội dung cho:

📊 Thông tin đầu vào:
- Đối tượng khách hàng (Persona): ${persona}
- Ngành nghề (Industry): ${industry}
${corpus_hints ? `- Gợi ý chủ đề: ${corpus_hints}` : ''}

📝 Yêu cầu định dạng:
Mỗi ý tưởng phải là một đối tượng JSON với các trường sau:

{
  "idea_id": "idea-uuid",           // ID duy nhất
  "one_liner": "...",               // Tiêu đề hấp dẫn (50-80 ký tự)
  "angle": "...",                   // Góc nhìn độc đáo (tùy chọn)
  "personas": ["..."],              // Mảng đối tượng mục tiêu cụ thể
  "why_now": ["..."],               // Lý do tại sao ý tưởng này phù hợp ngay bây giờ
  "evidence": [                     // Bằng chứng hỗ trợ
    {
      "title": "...",               // Tiêu đề nguồn
      "url": "https://...",         // URL nguồn tin
      "quote": "..."                // Trích dẫn quan trọng
    }
  ],
  "scores": {                       // Điểm đánh giá (0-5)
    "novelty": 4,                   // Độ mới lạ
    "demand": 5,                    // Nhu cầu thị trường
    "fit": 4,                       // Phù hợp với persona/industry
    "white_space": 3                // Khoảng trống cạnh tranh
  },
  "status": "proposed",             // Luôn là "proposed"
  "tags": ["AI", "Marketing"]       // Tags phân loại
}

🎯 Hướng dẫn tạo ý tưởng chất lượng cao:

1. **One-liner**: Ngắn gọn, hấp dẫn, làm người đọc tò mò
2. **Angle**: Góc nhìn độc đáo, khác biệt với content thông thường
3. **Personas**: Cụ thể (ví dụ: "Marketing Manager at B2B SaaS, 30-40 tuổi")
4. **Why now**: Liên kết với xu hướng, sự kiện, hoặc thay đổi hiện tại
5. **Evidence**: Nguồn đáng tin (báo cáo, nghiên cứu, case study)
6. **Scores**: Đánh giá trung thực, cân bằng
7. **Tags**: 2-5 tags liên quan

💡 Làm cho ý tưởng:
- Thực tế và có thể thực hiện
- Có giá trị thực sự cho đối tượng mục tiêu
- Khác biệt với content đã có
- Có tiềm năng viral/engagement cao

⚠️ YÊU CẦU FORMAT JSON QUAN TRỌNG:
1. Chỉ trả về JSON hợp lệ - không markdown, không code blocks, không giải thích, không text trước/sau
2. Bắt đầu response bằng [ hoặc { - không có gì trước đó
3. Kết thúc response bằng ] hoặc } - không có gì sau đó
4. Format: Trả về mảng JSON trực tiếp: [{"idea_id":"...","one_liner":"...",...}, ...]
5. Tạo chính xác ${count} ý tưởng hoàn chỉnh
6. Đảm bảo tất cả JSON được đóng đúng với brackets khớp

Ví dụ format:
[{"idea_id":"uuid-1","one_liner":"Tiêu đề 1",...},{"idea_id":"uuid-2","one_liner":"Tiêu đề 2",...}]

Chỉ trả về mảng JSON, không có gì khác.`;
    } else {
        return `Generate exactly ${count} high-quality content ideas for:

📊 Input Parameters:
- Target Persona: ${persona}
- Industry: ${industry}
${corpus_hints ? `- Topic Hints: ${corpus_hints}` : ''}

📝 Required Format:
Each idea must be a JSON object with these fields:

{
  "idea_id": "idea-uuid",           // Unique identifier
  "one_liner": "...",               // Catchy headline (50-80 chars)
  "angle": "...",                   // Unique perspective (optional)
  "personas": ["..."],              // Array of specific target audiences
  "why_now": ["..."],               // Reasons why this idea is timely
  "evidence": [                     // Supporting evidence
    {
      "title": "...",               // Source title
      "url": "https://...",         // Source URL
      "quote": "..."                // Key quote
    }
  ],
  "scores": {                       // Ratings (0-5)
    "novelty": 4,                   // How original/fresh
    "demand": 5,                    // Market demand
    "fit": 4,                       // Fit with persona/industry
    "white_space": 3                // Competition gap
  },
  "status": "proposed",             // Always "proposed"
  "tags": ["AI", "Marketing"]       // Categorization tags
}

🎯 Guidelines for High-Quality Ideas:

1. **One-liner**: Concise, compelling, curiosity-inducing
2. **Angle**: Unique perspective that differentiates from typical content
3. **Personas**: Specific (e.g., "Marketing Manager at B2B SaaS, 30-40 years old")
4. **Why now**: Link to current trends, events, or changes
5. **Evidence**: Credible sources (reports, research, case studies)
6. **Scores**: Honest, balanced assessment
7. **Tags**: 2-5 relevant tags

💡 Make Ideas:
- Practical and actionable
- Genuinely valuable to the target audience
- Different from existing content
- High viral/engagement potential

⚠️ CRITICAL JSON FORMAT REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no code blocks, no explanations, no text before/after
2. Start your response with [ or { - nothing else before it
3. End your response with ] or } - nothing else after it
4. Format: Return a JSON array directly: [{"idea_id":"...","one_liner":"...",...}, ...]
5. Generate exactly ${count} complete ideas
6. Ensure all JSON is properly closed with matching brackets

Example format:
[{"idea_id":"uuid-1","one_liner":"Title 1",...},{"idea_id":"uuid-2","one_liner":"Title 2",...}]

Return ONLY the JSON array, nothing else.`;
    }
}

// ============================================
// IDEA GENERATOR
// ============================================

export class IdeaGenerator {
    private client: AIClient;
    
    constructor() {
        // Initialize AI Client với retry config tối ưu cho generation
        this.client = new AIClient({
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2
        });
    }
    
    /**
     * Sinh ra content ideas từ persona và industry
     */
    async generate(request: GenerateIdeasRequest): Promise<GenerateIdeasResponse> {
        const startTime = Date.now();
        
        // Load LLM settings từ config hoặc dùng env
        const settings = loadLLMSettings();
        
        // Auto-detect provider dựa trên API keys có sẵn
        let provider = settings?.provider;
        let apiKey = settings?.apiKey || '';
        let model = settings?.model;
        
        if (!provider || !apiKey) {
            // Tự động chọn provider dựa trên API key có sẵn (priority: Gemini > OpenAI > Anthropic > DeepSeek)
            if (process.env.GEMINI_API_KEY) {
                provider = 'gemini';
                apiKey = process.env.GEMINI_API_KEY;
                model = model || 'gemini-2.5-flash'; // Latest stable Gemini model (June 2025)
            } else if (process.env.OPENAI_API_KEY) {
                provider = 'openai';
                apiKey = process.env.OPENAI_API_KEY;
                model = model || 'gpt-4o-mini';
            } else if (process.env.ANTHROPIC_API_KEY) {
                provider = 'anthropic';
                apiKey = process.env.ANTHROPIC_API_KEY;
                model = model || 'claude-3-5-sonnet-20241022';
            } else if (process.env.DEEPSEEK_API_KEY) {
                provider = 'deepseek';
                apiKey = process.env.DEEPSEEK_API_KEY;
                model = model || 'deepseek-chat';
            } else {
                throw new Error('No API key configured. Please set GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY in .env file');
            }
        }
        
        if (!apiKey) {
            throw new Error(`API key not configured for provider: ${provider}`);
        }
        
        // Default values
        const language = request.language || 'en';
        const temperature = request.temperature ?? 0.8; // Tương đối creative cho ideas
        const count = request.count || 10;
        
        console.log(`[IdeaGenerator] Generating ${count} ideas for:`, {
            persona: request.persona,
            industry: request.industry,
            provider,
            model,
            temperature
        });
        
        // Build prompts
        const systemPrompt = SYSTEM_PROMPTS[language];
        const userPrompt = buildPrompt(request);
        
        // Call AI với retry mechanism
        // Calculate maxTokens: ~800-1000 tokens per idea for detailed ideas (with evidence, scores, etc)
        const estimatedTokens = count * 1000 + 1000; // Extra buffer for JSON structure
        const maxTokens = Math.min(estimatedTokens, 8192); // Gemini 2.5 Flash max output tokens
        console.log(`[IdeaGenerator] Requesting ${maxTokens} max tokens for ${count} ideas`);
        
        const response = await this.client.complete({
            provider: provider as any,
            apiKey,
            model,
            systemPrompt,
            prompt: userPrompt,
            temperature,
            jsonMode: true, // Bắt buộc trả JSON
            maxTokens
        });
        
        // Log raw response immediately for debugging
        console.log(`[IdeaGenerator] ========== RAW AI RESPONSE ==========`);
        console.log(`[IdeaGenerator] Length: ${response.content.length} chars`);
        console.log(`[IdeaGenerator] First 500 chars:\n${response.content.substring(0, 500)}`);
        console.log(`[IdeaGenerator] Last 500 chars:\n${response.content.substring(Math.max(0, response.content.length - 500))}`);
        console.log(`[IdeaGenerator] ======================================`);
        
        // Parse response - Multiple strategies to extract JSON
        let rawIdeas: any[] = [];
        let jsonString = response.content.trim();
        
        // Strategy 1: Remove markdown code blocks (handle both complete and incomplete)
        // Try complete code block first: ```json ... ```
        let codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
        let codeBlockMatch = codeBlockRegex.exec(jsonString);
        if (codeBlockMatch) {
            jsonString = codeBlockMatch[1].trim();
            console.log('[IdeaGenerator] Strategy 1a: Extracted from complete code block');
            // Try to parse immediately after extraction
            try {
                const parsed = JSON.parse(jsonString);
                rawIdeas = Array.isArray(parsed) ? parsed : (parsed?.ideas || parsed?.data || []);
                if (rawIdeas.length > 0) {
                    console.log(`[IdeaGenerator] Strategy 1a SUCCESS: Parsed ${rawIdeas.length} ideas immediately`);
                }
            } catch (e) {
                console.log('[IdeaGenerator] Strategy 1a: Extracted but parse failed, trying other strategies');
            }
        } else {
            // Try incomplete code block: ```json ... (no closing)
            codeBlockRegex = /```(?:json)?\s*([\s\S]*)/;
            codeBlockMatch = codeBlockRegex.exec(jsonString);
            if (codeBlockMatch) {
                jsonString = codeBlockMatch[1].trim();
                console.log('[IdeaGenerator] Strategy 1b: Extracted from incomplete code block (no closing backticks)');
                // Try to parse immediately after extraction
                try {
                    const parsed = JSON.parse(jsonString);
                    rawIdeas = Array.isArray(parsed) ? parsed : (parsed?.ideas || parsed?.data || []);
                    if (rawIdeas.length > 0) {
                        console.log(`[IdeaGenerator] Strategy 1b SUCCESS: Parsed ${rawIdeas.length} ideas immediately`);
                    }
                } catch (e) {
                    console.log('[IdeaGenerator] Strategy 1b: Extracted but parse failed, trying other strategies');
                }
            }
        }
        
        // Strategy 2: Try to find JSON object with "ideas" key (most common)
        if (rawIdeas.length === 0) {
            const ideasObjectRegex = /\{\s*"ideas"\s*:\s*\[[\s\S]*?\]\s*\}/;
            let ideasMatch = jsonString.match(ideasObjectRegex);
            if (ideasMatch) {
                try {
                    const parsed = JSON.parse(ideasMatch[0]);
                    rawIdeas = parsed.ideas || [];
                    console.log(`[IdeaGenerator] Strategy 2 success: Found ${rawIdeas.length} ideas in "ideas" object`);
                } catch (e) {
                    console.warn('[IdeaGenerator] Strategy 2 failed:', e);
                }
            }
        }
        
        // Strategy 3: Try to find JSON array directly (complete or incomplete)
        if (rawIdeas.length === 0) {
            // Try complete array first
            const arrayRegex = /\[[\s\S]*?\]/;
            let arrayMatch = jsonString.match(arrayRegex);
            if (arrayMatch) {
                try {
                    const parsed = JSON.parse(arrayMatch[0]);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        rawIdeas = parsed;
                        console.log(`[IdeaGenerator] Strategy 3a success: Found ${rawIdeas.length} ideas in complete array`);
                    }
                } catch (e) {
                    console.warn('[IdeaGenerator] Strategy 3a failed (incomplete array?):', e.message?.substring(0, 50));
                    // If parse fails, it's likely incomplete - Strategy 5 will handle it
                }
            }
            
            // If no complete array or parse failed, check for incomplete array
            if (rawIdeas.length === 0) {
                const incompleteArrayRegex = /\[[\s\S]*/;
                arrayMatch = jsonString.match(incompleteArrayRegex);
                if (arrayMatch) {
                    console.log('[IdeaGenerator] Strategy 3b: Found incomplete array, Strategy 5 will extract complete ideas');
                }
            }
        }
        
        // Strategy 4: Try to parse entire response as JSON
        if (rawIdeas.length === 0) {
            try {
                const parsed = JSON.parse(jsonString);
                rawIdeas = Array.isArray(parsed) 
                    ? parsed 
                    : (parsed?.ideas || parsed?.data || parsed?.content || []);
                console.log(`[IdeaGenerator] Strategy 4 success: Parsed entire response, found ${rawIdeas.length} ideas`);
            } catch (e) {
                console.warn('[IdeaGenerator] Strategy 4 failed:', e.message?.substring(0, 50));
                // If response starts with [ but parse failed, it's likely incomplete
                // Strategy 5 will handle extracting complete ideas
                if (jsonString.trim().startsWith('[')) {
                    console.log('[IdeaGenerator] Strategy 4: Response starts with [ but parse failed - Strategy 5 will extract complete ideas');
                }
            }
        }
        
        // Strategy 5: Extract complete idea objects from incomplete JSON (IMPROVED)
        // CRITICAL: Always try this if we have array-like content but no ideas yet
        // This handles the most common case: incomplete JSON arrays from Gemini
        const hasArrayStart = jsonString.includes('[') || response.content.includes('[');
        if (rawIdeas.length === 0 && hasArrayStart) {
            try {
                console.log('[IdeaGenerator] Strategy 5: Attempting to extract ideas from incomplete JSON...');
                console.log(`[IdeaGenerator] Strategy 5: jsonString has '[': ${jsonString.includes('[')}, response.content has '[': ${response.content.includes('[')}`);
                
                // Try both processed jsonString and original response.content
                const stringsToTry = [jsonString, response.content.trim()];
                
                for (let strIdx = 0; strIdx < stringsToTry.length && rawIdeas.length === 0; strIdx++) {
                    const currentString = stringsToTry[strIdx];
                    console.log(`[IdeaGenerator] Strategy 5: Trying string ${strIdx + 1}/${stringsToTry.length} (length: ${currentString.length})`);
                    
                    // Find array start - try multiple patterns
                    let arrayStart = currentString.indexOf('[');
                    if (arrayStart < 0) {
                        // Try after markdown code block
                        const afterCodeBlock = currentString.indexOf('```json');
                        if (afterCodeBlock >= 0) {
                            arrayStart = currentString.indexOf('[', afterCodeBlock + 7);
                        }
                    }
                    
                    // Also try after ``` without json
                    if (arrayStart < 0) {
                        const afterCodeBlock = currentString.indexOf('```');
                        if (afterCodeBlock >= 0) {
                            arrayStart = currentString.indexOf('[', afterCodeBlock + 3);
                        }
                    }
                
                    if (arrayStart >= 0) {
                        const arrayContent = currentString.substring(arrayStart + 1);
                        console.log(`[IdeaGenerator] Strategy 5: Found array start at position ${arrayStart}, content length: ${arrayContent.length}`);
                    
                    // Extract complete idea objects using balanced bracket matching
                    const extractedIdeas: any[] = [];
                    let currentPos = 0;
                    let braceCount = 0;
                    let startPos = -1;
                    let inString = false;
                    let escapeNext = false;
                    
                    while (currentPos < arrayContent.length) {
                        const char = arrayContent[currentPos];
                        
                        // Handle string escaping
                        if (escapeNext) {
                            escapeNext = false;
                            currentPos++;
                            continue;
                        }
                        
                        if (char === '\\') {
                            escapeNext = true;
                            currentPos++;
                            continue;
                        }
                        
                        if (char === '"' && !escapeNext) {
                            inString = !inString;
                            currentPos++;
                            continue;
                        }
                        
                        if (inString) {
                            currentPos++;
                            continue;
                        }
                        
                        // Track brackets only when not in string
                        if (char === '{') {
                            if (braceCount === 0) {
                                startPos = currentPos;
                            }
                            braceCount++;
                        } else if (char === '}') {
                            braceCount--;
                            if (braceCount === 0 && startPos >= 0) {
                                // Found complete idea object
                                const ideaJson = arrayContent.substring(startPos, currentPos + 1);
                                try {
                                    const idea = JSON.parse(ideaJson);
                                    // Validate idea has required fields
                                    if (idea && (idea.idea_id || idea.one_liner)) {
                                        extractedIdeas.push(idea);
                                        console.log(`[IdeaGenerator] Strategy 5: ✓ Extracted idea ${extractedIdeas.length}: "${idea.one_liner?.substring(0, 60)}..."`);
                                    } else {
                                        console.warn(`[IdeaGenerator] Strategy 5: Skipped invalid idea (no idea_id or one_liner)`);
                                    }
                                } catch (parseError: any) {
                                    console.warn(`[IdeaGenerator] Strategy 5: Failed to parse idea object: ${parseError.message?.substring(0, 50)}`);
                                }
                                startPos = -1;
                            }
                        }
                        // Note: We don't track [ ] brackets because nested arrays inside idea objects
                        // are handled automatically by the braceCount logic
                        
                        currentPos++;
                    }
                    
                        if (extractedIdeas.length > 0) {
                            rawIdeas = extractedIdeas;
                            console.log(`[IdeaGenerator] Strategy 5 SUCCESS: Extracted ${rawIdeas.length} complete ideas from incomplete JSON (using string ${strIdx + 1})`);
                            break; // Exit loop if successful
                        } else {
                            console.warn(`[IdeaGenerator] Strategy 5: No complete ideas extracted from string ${strIdx + 1}`);
                        }
                    } else {
                        console.warn(`[IdeaGenerator] Strategy 5: No array start found in string ${strIdx + 1}`);
                    }
                }
            } catch (e: any) {
                console.error('[IdeaGenerator] Strategy 5 failed with error:', e.message);
            }
        }
        
        // Strategy 6: Fallback - Use same balanced bracket matching as Strategy 5 but on entire jsonString
        if (rawIdeas.length === 0) {
            try {
                console.log('[IdeaGenerator] Strategy 6: Fallback extraction from entire response...');
                
                // Use same logic as Strategy 5 but on entire string
                const extractedIdeas: any[] = [];
                let currentPos = 0;
                let braceCount = 0;
                let startPos = -1;
                let inString = false;
                let escapeNext = false;
                
                while (currentPos < jsonString.length) {
                    const char = jsonString[currentPos];
                    
                    if (escapeNext) {
                        escapeNext = false;
                        currentPos++;
                        continue;
                    }
                    
                    if (char === '\\') {
                        escapeNext = true;
                        currentPos++;
                        continue;
                    }
                    
                    if (char === '"' && !escapeNext) {
                        inString = !inString;
                        currentPos++;
                        continue;
                    }
                    
                    if (inString) {
                        currentPos++;
                        continue;
                    }
                    
                    if (char === '{') {
                        if (braceCount === 0) {
                            startPos = currentPos;
                        }
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0 && startPos >= 0) {
                            const ideaJson = jsonString.substring(startPos, currentPos + 1);
                            try {
                                const idea = JSON.parse(ideaJson);
                                // Check if this looks like an idea object
                                if (idea && (idea.idea_id || idea.one_liner) && !idea.ideas) {
                                    // Avoid adding wrapper objects
                                    extractedIdeas.push(idea);
                                    console.log(`[IdeaGenerator] Strategy 6: ✓ Extracted idea ${extractedIdeas.length}: "${idea.one_liner?.substring(0, 60)}..."`);
                                }
                            } catch (e) {
                                // Skip invalid
                            }
                            startPos = -1;
                        }
                    }
                    currentPos++;
                }
                
                if (extractedIdeas.length > 0) {
                    rawIdeas = extractedIdeas;
                    console.log(`[IdeaGenerator] Strategy 6 SUCCESS: Extracted ${rawIdeas.length} ideas from entire response`);
                }
            } catch (e: any) {
                console.warn('[IdeaGenerator] Strategy 6 failed:', e.message);
            }
        }
        
        // Strategy 7: Last resort - Extract any JSON objects with "idea_id" field using regex
        if (rawIdeas.length === 0) {
            try {
                console.log('[IdeaGenerator] Strategy 7: Last resort - extracting objects with idea_id field...');
                
                // Find all potential idea objects by looking for "idea_id" pattern
                const ideaIdPattern = /"idea_id"\s*:\s*"([^"]+)"/g;
                const matches: Array<{id: string, start: number}> = [];
                let match;
                
                while ((match = ideaIdPattern.exec(jsonString)) !== null) {
                    matches.push({ id: match[1], start: match.index });
                }
                
                console.log(`[IdeaGenerator] Strategy 7: Found ${matches.length} potential ideas with idea_id field`);
                
                // For each match, try to extract the complete object
                const extractedIdeas: any[] = [];
                for (const { id, start } of matches) {
                    // Find the opening { before this idea_id
                    let objStart = start;
                    while (objStart > 0 && jsonString[objStart] !== '{') {
                        objStart--;
                    }
                    
                    if (objStart >= 0) {
                        // Extract from { to matching }
                        let braceCount = 0;
                        let objEnd = objStart;
                        let inString = false;
                        let escapeNext = false;
                        
                        while (objEnd < jsonString.length) {
                            const char = jsonString[objEnd];
                            if (escapeNext) {
                                escapeNext = false;
                                objEnd++;
                                continue;
                            }
                            if (char === '\\') {
                                escapeNext = true;
                                objEnd++;
                                continue;
                            }
                            if (char === '"' && !escapeNext) {
                                inString = !inString;
                            }
                            if (!inString) {
                                if (char === '{') braceCount++;
                                if (char === '}') {
                                    braceCount--;
                                    if (braceCount === 0) {
                                        // Found complete object
                                        try {
                                            const ideaJson = jsonString.substring(objStart, objEnd + 1);
                                            const idea = JSON.parse(ideaJson);
                                            if (idea.idea_id === id && (idea.one_liner || idea.description)) {
                                                extractedIdeas.push(idea);
                                                console.log(`[IdeaGenerator] Strategy 7: ✓ Extracted idea "${idea.one_liner?.substring(0, 50)}..."`);
                                            }
                                        } catch (e) {
                                            // Skip invalid
                                        }
                                        break;
                                    }
                                }
                            }
                            objEnd++;
                        }
                    }
                }
                
                if (extractedIdeas.length > 0) {
                    rawIdeas = extractedIdeas;
                    console.log(`[IdeaGenerator] Strategy 7 SUCCESS: Extracted ${rawIdeas.length} ideas using idea_id pattern matching`);
                }
            } catch (e: any) {
                console.warn('[IdeaGenerator] Strategy 7 failed:', e.message);
            }
        }
        
        // If still no ideas, throw error with full context
        if (rawIdeas.length === 0) {
            console.error('[IdeaGenerator] All parsing strategies failed');
            console.error('[IdeaGenerator] Full response (first 1000 chars):', jsonString.substring(0, 1000));
            console.error('[IdeaGenerator] Full response (last 500 chars):', jsonString.substring(Math.max(0, jsonString.length - 500)));
            
            // Try to provide helpful error message
            const preview = jsonString.substring(0, 200);
            const hasBrackets = jsonString.includes('[') || jsonString.includes('{');
            const hasIdeas = jsonString.toLowerCase().includes('idea');
            
            let errorMsg = `Invalid JSON response: Could not extract ideas. `;
            errorMsg += `Response length: ${jsonString.length} chars. `;
            errorMsg += `Has brackets: ${hasBrackets}. `;
            errorMsg += `Has "idea" text: ${hasIdeas}. `;
            errorMsg += `Preview: ${preview}...`;
            
            throw new Error(errorMsg);
        }
        
        console.log(`[IdeaGenerator] Successfully parsed ${rawIdeas.length} ideas`);
        
        // Normalize và validate ideas
        const ideas: ContentIdea[] = [];
        for (const rawIdea of rawIdeas) {
            try {
                const normalized = this.normalizeIdea(rawIdea);
                ideas.push(normalized);
            } catch (e) {
                console.warn('[IdeaGenerator] Skipping invalid idea:', e);
            }
        }
        
        if (ideas.length === 0) {
            throw new Error('No valid ideas generated');
        }
        
        const durationMs = Date.now() - startTime;
        
        console.log(`[IdeaGenerator] Generated ${ideas.length} valid ideas in ${durationMs}ms`);
        
        return {
            ideas,
            metadata: {
                provider: response.provider,
                model: response.model,
                tokensUsed: response.tokensUsed,
                temperature,
                durationMs
            }
        };
    }
    
    /**
     * Normalize và validate một idea
     */
    private normalizeIdea(rawIdea: any): ContentIdea {
        // Generate ID nếu không có
        const idea_id = rawIdea?.idea_id || `idea-${randomUUID()}`;
        
        // Normalize các fields
        const normalized: ContentIdea = {
            idea_id,
            one_liner: rawIdea?.one_liner || 'Untitled Idea',
            angle: rawIdea?.angle || undefined,
            personas: Array.isArray(rawIdea?.personas) 
                ? rawIdea.personas.filter((p: any) => typeof p === 'string')
                : [],
            why_now: Array.isArray(rawIdea?.why_now)
                ? rawIdea.why_now.filter((w: any) => typeof w === 'string')
                : [],
            evidence: this.normalizeEvidence(rawIdea?.evidence),
            scores: this.normalizeScores(rawIdea?.scores),
            status: rawIdea?.status || 'proposed',
            tags: Array.isArray(rawIdea?.tags)
                ? rawIdea.tags.filter((t: any) => typeof t === 'string')
                : []
        };
        
        // Validate required fields
        if (!normalized.one_liner) {
            throw new Error('Missing one_liner');
        }
        
        if (normalized.personas.length === 0) {
            normalized.personas = ['General Audience'];
        }
        
        return normalized;
    }
    
    /**
     * Normalize evidence array
     */
    private normalizeEvidence(rawEvidence: any): ContentIdea['evidence'] {
        if (!Array.isArray(rawEvidence)) {
            return [];
        }
        
        return rawEvidence
            .filter(e => e?.url && e?.quote)
            .map(e => ({
                title: e.title || undefined,
                url: e.url,
                quote: e.quote
            }));
    }
    
    /**
     * Normalize scores object
     */
    private normalizeScores(rawScores: any): ContentIdea['scores'] {
        const clamp = (val: any, min: number, max: number) => {
            const num = typeof val === 'number' ? val : 3;
            return Math.max(min, Math.min(max, Math.round(num)));
        };
        
        return {
            novelty: clamp(rawScores?.novelty, 0, 5),
            demand: clamp(rawScores?.demand, 0, 5),
            fit: clamp(rawScores?.fit, 0, 5),
            white_space: clamp(rawScores?.white_space, 0, 5)
        };
    }
}

// Export singleton instance
export const ideaGenerator = new IdeaGenerator();

