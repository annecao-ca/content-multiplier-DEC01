/**
 * VALIDATED IDEA GENERATOR
 * 
 * Generator với validation và retry logic
 * Đảm bảo AI trả về đúng format: title, description, rationale
 */

import { AIClient } from '../../../../packages/utils/ai-client';
import { AIValidator, IdeaValidator, retryWithValidation, ValidationRule } from '../../../../packages/utils/ai-validator';
import { loadLLMSettings } from './settingsStore';
import { randomUUID } from 'crypto';

// ============================================
// TYPES
// ============================================

export interface ValidatedIdeaRequest {
    persona: string;
    industry: string;
    corpus_hints?: string;
    language?: 'en' | 'vn';
    count?: number;
    temperature?: number;
}

export interface ValidatedIdea {
    id: string;
    title: string;              // Tiêu đề (10-200 chars)
    description: string;        // Mô tả (20-1000 chars)
    rationale: string;          // Lý do (20-500 chars)
    target_audience?: string[]; // Đối tượng mục tiêu
    tags?: string[];            // Tags
    score?: number;             // Điểm 0-5
}

export interface ValidatedIdeaResponse {
    ideas: ValidatedIdea[];
    metadata: {
        provider: string;
        model: string;
        attempts: number;       // Số lần thử
        tokensUsed?: number;
        durationMs: number;
    };
}

// ============================================
// VALIDATION RULES
// ============================================

const IDEA_VALIDATION_RULES: ValidationRule<ValidatedIdea>[] = [
    {
        field: 'title',
        required: true,
        type: 'string',
        minLength: 10,
        maxLength: 200,
        custom: (value: string) => {
            // Title không được chỉ là số
            if (/^\d+$/.test(value)) {
                return 'Title cannot be just numbers';
            }
            return true;
        }
    },
    {
        field: 'description',
        required: true,
        type: 'string',
        minLength: 20,
        maxLength: 1000,
        custom: (value: string) => {
            // Description phải có ít nhất 3 từ
            const wordCount = value.trim().split(/\s+/).length;
            if (wordCount < 3) {
                return 'Description must have at least 3 words';
            }
            return true;
        }
    },
    {
        field: 'rationale',
        required: true,
        type: 'string',
        minLength: 20,
        maxLength: 500,
        custom: (value: string) => {
            // Rationale phải giải thích "why"
            const hasWhy = /why|because|reason|relevant|timely|important/i.test(value);
            if (!hasWhy) {
                return 'Rationale should explain why this idea matters';
            }
            return true;
        }
    },
    {
        field: 'target_audience',
        required: false,
        type: 'array',
        minLength: 1
    },
    {
        field: 'tags',
        required: false,
        type: 'array'
    },
    {
        field: 'score',
        required: false,
        type: 'number',
        custom: (value: number) => {
            if (typeof value !== 'number') return true;
            return value >= 0 && value <= 5 ? true : 'Score must be 0-5';
        }
    }
];

// ============================================
// PROMPT TEMPLATES
// ============================================

const SYSTEM_PROMPTS = {
    en: `You are an expert content strategist. Generate innovative content ideas that are:
- Specific and actionable
- Backed by trends and data
- Relevant to the target audience
- Unique and creative

IMPORTANT: Follow the EXACT format specified. All required fields must be present and valid.`,

    vn: `Bạn là chiến lược gia nội dung chuyên nghiệp. Tạo ý tưởng nội dung:
- Cụ thể và có thể thực hiện
- Dựa trên xu hướng và dữ liệu
- Phù hợp với đối tượng mục tiêu
- Độc đáo và sáng tạo

QUAN TRỌNG: Tuân thủ CHÍNH XÁC định dạng được chỉ định. Tất cả các trường bắt buộc phải có và hợp lệ.`
};

function buildPrompt(
    request: ValidatedIdeaRequest,
    feedback?: string
): string {
    const { persona, industry, corpus_hints, language = 'en', count = 10 } = request;
    
    if (language === 'vn') {
        let prompt = `Tạo ${count} ý tưởng nội dung cho:

📊 Thông tin:
- Đối tượng: ${persona}
- Ngành: ${industry}
${corpus_hints ? `- Chủ đề: ${corpus_hints}` : ''}

📝 Format BẮT BUỘC (JSON):
{
  "ideas": [
    {
      "title": "Tiêu đề hấp dẫn (10-200 ký tự)",
      "description": "Mô tả chi tiết về ý tưởng (20-1000 ký tự)",
      "rationale": "Giải thích TẠI SAO ý tưởng này quan trọng ngay bây giờ (20-500 ký tự)",
      "target_audience": ["Đối tượng 1", "Đối tượng 2"],
      "tags": ["tag1", "tag2"],
      "score": 4.5
    }
  ]
}

✅ Yêu cầu:
1. title: Ngắn gọn, hấp dẫn, 10-200 ký tự
2. description: Chi tiết, rõ ràng, 20-1000 ký tự
3. rationale: Giải thích "tại sao bây giờ", 20-500 ký tự
4. target_audience: Mảng các đối tượng cụ thể (tùy chọn)
5. tags: Mảng tags liên quan (tùy chọn)
6. score: Điểm 0-5 (tùy chọn)

⚠️ LƯU Ý:
- PHẢI trả về đúng ${count} ý tưởng
- PHẢI có đầy đủ 3 trường bắt buộc: title, description, rationale
- Mỗi trường PHẢI đạt độ dài tối thiểu`;

        if (feedback) {
            prompt += `\n\n❌ LỖI LẦN TRƯỚC:\n${feedback}\n\n✅ Hãy sửa và thử lại!`;
        }
        
        return prompt;
        
    } else {
        let prompt = `Generate ${count} content ideas for:

📊 Context:
- Persona: ${persona}
- Industry: ${industry}
${corpus_hints ? `- Topics: ${corpus_hints}` : ''}

📝 REQUIRED Format (JSON):
{
  "ideas": [
    {
      "title": "Catchy headline (10-200 chars)",
      "description": "Detailed explanation of the idea (20-1000 chars)",
      "rationale": "WHY this idea matters now (20-500 chars)",
      "target_audience": ["Audience 1", "Audience 2"],
      "tags": ["tag1", "tag2"],
      "score": 4.5
    }
  ]
}

✅ Requirements:
1. title: Concise, compelling, 10-200 characters
2. description: Detailed, clear, 20-1000 characters
3. rationale: Explain "why now", 20-500 characters
4. target_audience: Array of specific audiences (optional)
5. tags: Array of relevant tags (optional)
6. score: Rating 0-5 (optional)

⚠️ IMPORTANT:
- MUST return exactly ${count} ideas
- MUST include all 3 required fields: title, description, rationale
- Each field MUST meet minimum length requirements`;

        if (feedback) {
            prompt += `\n\n❌ PREVIOUS ERRORS:\n${feedback}\n\n✅ Please fix and try again!`;
        }
        
        return prompt;
    }
}

// ============================================
// VALIDATED IDEA GENERATOR
// ============================================

export class ValidatedIdeaGenerator {
    private client: AIClient;
    private validator: AIValidator;
    
    constructor() {
        this.client = new AIClient({
            maxRetries: 1, // Validator sẽ handle retry
            initialDelay: 500
        });
        this.validator = new AIValidator();
    }
    
    /**
     * Generate ideas với validation và retry
     */
    async generate(request: ValidatedIdeaRequest): Promise<ValidatedIdeaResponse> {
        const startTime = Date.now();
        
        // Load settings
        const settings = loadLLMSettings();
        const provider = settings?.provider || 'openai';
        const apiKey = settings?.apiKey || process.env.OPENAI_API_KEY || '';
        const model = settings?.model;
        
        if (!apiKey) {
            throw new Error(`API key not configured for provider: ${provider}`);
        }
        
        const language = request.language || 'en';
        const temperature = request.temperature ?? 0.8;
        const count = request.count || 10;
        
        console.log(`[ValidatedIdeaGenerator] Generating ${count} ideas with validation`);
        
        let totalAttempts = 0;
        let totalTokens = 0;
        
        // Retry với validation
        const result = await retryWithValidation({
            validator: this.validator,
            rules: IDEA_VALIDATION_RULES,
            maxRetries: 3,
            
            onRetry: (attempt, errors) => {
                console.warn(`[ValidatedIdeaGenerator] Retry ${attempt}: ${errors.length} errors`);
            },
            
            generatePrompt: async (feedback) => {
                totalAttempts++;
                
                const systemPrompt = SYSTEM_PROMPTS[language];
                const userPrompt = buildPrompt(request, feedback);
                
                console.log(`[ValidatedIdeaGenerator] Attempt ${totalAttempts}...`);
                
                const response = await this.client.complete({
                    provider: provider as any,
                    apiKey,
                    model,
                    systemPrompt,
                    prompt: userPrompt,
                    temperature,
                    jsonMode: true,
                    maxTokens: 4000
                });
                
                if (response.tokensUsed) {
                    totalTokens += response.tokensUsed.total;
                }
                
                const parsed = JSON.parse(response.content);
                
                // Extract ideas array
                const ideas = Array.isArray(parsed) ? parsed : (parsed.ideas || []);
                
                return ideas;
            }
        });
        
        // Normalize ideas
        const normalizedIdeas: ValidatedIdea[] = result.data.map((idea: any) => ({
            id: idea.id || `idea-${randomUUID()}`,
            title: idea.title,
            description: idea.description,
            rationale: idea.rationale,
            target_audience: idea.target_audience,
            tags: idea.tags,
            score: idea.score
        }));
        
        const durationMs = Date.now() - startTime;
        
        console.log(`[ValidatedIdeaGenerator] ✅ Generated ${normalizedIdeas.length} valid ideas in ${totalAttempts} attempt(s)`);
        
        return {
            ideas: normalizedIdeas,
            metadata: {
                provider,
                model: model || 'default',
                attempts: totalAttempts,
                tokensUsed: totalTokens,
                durationMs
            }
        };
    }
}

// Export singleton
export const validatedIdeaGenerator = new ValidatedIdeaGenerator();

