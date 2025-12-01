/**
 * Universal AI Client - Hỗ trợ nhiều nhà cung cấp AI
 * OpenAI, Gemini, Anthropic, DeepSeek, Grok
 * 
 * Features:
 * - Retry mechanism (3 lần)
 * - Temperature control
 * - JSON và Text mode
 * - Streaming support
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================
// TYPES & INTERFACES
// ============================================

export type AIProvider = 'openai' | 'gemini' | 'anthropic' | 'deepseek' | 'grok';

export interface AIRequest {
    provider: AIProvider;
    apiKey: string;
    model?: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number; // 0.0 - 2.0
    maxTokens?: number;
    jsonMode?: boolean; // Bắt buộc trả JSON
    stream?: boolean; // Streaming response
}

export interface AIResponse {
    content: string;
    provider: AIProvider;
    model: string;
    tokensUsed?: {
        prompt: number;
        completion: number;
        total: number;
    };
    finishReason?: string;
}

export interface RetryConfig {
    maxRetries: number;
    initialDelay: number; // ms
    maxDelay: number; // ms
    backoffMultiplier: number;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

const DEFAULT_MODELS: Record<AIProvider, string> = {
    openai: 'gpt-4o-mini',
    gemini: 'gemini-2.5-flash', // Latest stable Gemini model (June 2025)
    anthropic: 'claude-3-5-sonnet-20241022',
    deepseek: 'deepseek-chat',
    grok: 'grok-beta'
};

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sleep function cho retry delay
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exponential backoff delay calculation
 */
function getRetryDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    return Math.min(delay, config.maxDelay);
}

/**
 * Kiểm tra xem lỗi có thể retry không
 */
function isRetryableError(error: any): boolean {
    // Rate limit, timeout, network errors
    const retryableStatusCodes = [429, 500, 502, 503, 504];
    const statusCode = error?.status || error?.statusCode;
    
    if (retryableStatusCodes.includes(statusCode)) {
        return true;
    }
    
    // Network errors
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        return true;
    }
    
    return false;
}

// ============================================
// PROVIDER IMPLEMENTATIONS
// ============================================

/**
 * OpenAI Implementation
 */
async function callOpenAI(request: AIRequest): Promise<AIResponse> {
    const client = new OpenAI({ apiKey: request.apiKey });
    const model = request.model || DEFAULT_MODELS.openai;
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    messages.push({ role: 'user', content: request.prompt });
    
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
    };
    
    if (request.jsonMode) {
        params.response_format = { type: 'json_object' };
    }
    
    if (request.stream) {
        params.stream = true;
    }
    
    const response = await client.chat.completions.create(params);
    
    return {
        content: response.choices[0]?.message?.content || '',
        provider: 'openai',
        model,
        tokensUsed: response.usage ? {
            prompt: response.usage.prompt_tokens,
            completion: response.usage.completion_tokens,
            total: response.usage.total_tokens
        } : undefined,
        finishReason: response.choices[0]?.finish_reason
    };
}

/**
 * DeepSeek Implementation (sử dụng OpenAI-compatible API)
 */
async function callDeepSeek(request: AIRequest): Promise<AIResponse> {
    const client = new OpenAI({
        apiKey: request.apiKey,
        baseURL: 'https://api.deepseek.com'
    });
    
    const model = request.model || DEFAULT_MODELS.deepseek;
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    messages.push({ role: 'user', content: request.prompt });
    
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
    };
    
    if (request.jsonMode) {
        params.response_format = { type: 'json_object' };
    }
    
    const response = await client.chat.completions.create(params);
    
    return {
        content: response.choices[0]?.message?.content || '',
        provider: 'deepseek',
        model,
        tokensUsed: response.usage ? {
            prompt: response.usage.prompt_tokens,
            completion: response.usage.completion_tokens,
            total: response.usage.total_tokens
        } : undefined,
        finishReason: response.choices[0]?.finish_reason
    };
}

/**
 * Anthropic Claude Implementation
 */
async function callAnthropic(request: AIRequest): Promise<AIResponse> {
    const client = new Anthropic({ apiKey: request.apiKey });
    const model = request.model || DEFAULT_MODELS.anthropic;
    
    const params: Anthropic.MessageCreateParams = {
        model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        messages: [
            { role: 'user', content: request.prompt }
        ]
    };
    
    if (request.systemPrompt) {
        params.system = request.systemPrompt;
    }
    
    // Claude không có native JSON mode, thêm vào system prompt
    if (request.jsonMode && params.system) {
        params.system += '\n\nYou must respond ONLY with valid JSON. No other text.';
    }
    
    const response = await client.messages.create(params);
    
    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';
    
    return {
        content: textContent,
        provider: 'anthropic',
        model,
        tokensUsed: {
            prompt: response.usage.input_tokens,
            completion: response.usage.output_tokens,
            total: response.usage.input_tokens + response.usage.output_tokens
        },
        finishReason: response.stop_reason || undefined
    };
}

/**
 * Google Gemini Implementation
 */
async function callGemini(request: AIRequest): Promise<AIResponse> {
    const genAI = new GoogleGenerativeAI(request.apiKey);
    const model = request.model || DEFAULT_MODELS.gemini;
    
    const generativeModel = genAI.getGenerativeModel({
        model,
        generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens,
        }
    });
    
    let fullPrompt = '';
    
    if (request.systemPrompt) {
        fullPrompt += `${request.systemPrompt}\n\n`;
    }
    
    fullPrompt += request.prompt;
    
    // Gemini không có native JSON mode
    if (request.jsonMode) {
        fullPrompt += '\n\nRespond ONLY with valid JSON. No markdown, no code blocks, just raw JSON.';
    }
    
    const result = await generativeModel.generateContent(fullPrompt);
    const response = result.response;
    
    return {
        content: response.text(),
        provider: 'gemini',
        model,
        tokensUsed: response.usageMetadata ? {
            prompt: response.usageMetadata.promptTokenCount || 0,
            completion: response.usageMetadata.candidatesTokenCount || 0,
            total: response.usageMetadata.totalTokenCount || 0
        } : undefined,
        finishReason: response.candidates?.[0]?.finishReason
    };
}

/**
 * xAI Grok Implementation (OpenAI-compatible)
 */
async function callGrok(request: AIRequest): Promise<AIResponse> {
    const client = new OpenAI({
        apiKey: request.apiKey,
        baseURL: 'https://api.x.ai/v1'
    });
    
    const model = request.model || DEFAULT_MODELS.grok;
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    
    if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    messages.push({ role: 'user', content: request.prompt });
    
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
    };
    
    if (request.jsonMode) {
        params.response_format = { type: 'json_object' };
    }
    
    const response = await client.chat.completions.create(params);
    
    return {
        content: response.choices[0]?.message?.content || '',
        provider: 'grok',
        model,
        tokensUsed: response.usage ? {
            prompt: response.usage.prompt_tokens,
            completion: response.usage.completion_tokens,
            total: response.usage.total_tokens
        } : undefined,
        finishReason: response.choices[0]?.finish_reason
    };
}

// ============================================
// MAIN AI CLIENT
// ============================================

/**
 * Universal AI Client với retry mechanism
 */
export class AIClient {
    private retryConfig: RetryConfig;
    
    constructor(retryConfig: Partial<RetryConfig> = {}) {
        this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    }
    
    /**
     * Gọi AI với retry logic
     */
    async complete(request: AIRequest): Promise<AIResponse> {
        let lastError: any;
        
        for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                // Attempt để gọi AI
                const response = await this.callProvider(request);
                
                // Nếu JSON mode, validate JSON
                if (request.jsonMode) {
                    try {
                        JSON.parse(response.content);
                    } catch (e) {
                        throw new Error(`Invalid JSON response: ${response.content}`);
                    }
                }
                
                return response;
                
            } catch (error: any) {
                lastError = error;
                
                console.error(`[AIClient] Attempt ${attempt + 1} failed:`, error.message);
                
                // Kiểm tra có nên retry không
                if (attempt < this.retryConfig.maxRetries && isRetryableError(error)) {
                    const delay = getRetryDelay(attempt, this.retryConfig);
                    console.log(`[AIClient] Retrying after ${delay}ms...`);
                    await sleep(delay);
                    continue;
                }
                
                // Không retry được nữa
                break;
            }
        }
        
        // Tất cả attempts đều fail
        throw new Error(
            `Failed after ${this.retryConfig.maxRetries + 1} attempts. Last error: ${lastError?.message || lastError}`
        );
    }
    
    /**
     * Gọi provider cụ thể
     */
    private async callProvider(request: AIRequest): Promise<AIResponse> {
        switch (request.provider) {
            case 'openai':
                return await callOpenAI(request);
            case 'deepseek':
                return await callDeepSeek(request);
            case 'anthropic':
                return await callAnthropic(request);
            case 'gemini':
                return await callGemini(request);
            case 'grok':
                return await callGrok(request);
            default:
                throw new Error(`Unsupported provider: ${request.provider}`);
        }
    }
    
    /**
     * Validate API key trước khi gọi
     */
    async testConnection(provider: AIProvider, apiKey: string): Promise<boolean> {
        try {
            const response = await this.complete({
                provider,
                apiKey,
                prompt: 'Say "Hello" in one word.',
                temperature: 0,
                maxTokens: 10
            });
            
            return response.content.length > 0;
        } catch (error) {
            console.error('[AIClient] Connection test failed:', error);
            return false;
        }
    }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Quick helper để gọi AI một cách đơn giản
 */
export async function generateContent(
    provider: AIProvider,
    apiKey: string,
    prompt: string,
    options: {
        model?: string;
        systemPrompt?: string;
        temperature?: number;
        maxTokens?: number;
        jsonMode?: boolean;
    } = {}
): Promise<string> {
    const client = new AIClient();
    
    const response = await client.complete({
        provider,
        apiKey,
        prompt,
        ...options
    });
    
    return response.content;
}

/**
 * Batch processing nhiều prompts
 */
export async function generateBatch(
    provider: AIProvider,
    apiKey: string,
    prompts: string[],
    options: {
        model?: string;
        systemPrompt?: string;
        temperature?: number;
        concurrency?: number;
    } = {}
): Promise<string[]> {
    const client = new AIClient();
    const concurrency = options.concurrency || 3;
    const results: string[] = [];
    
    // Process in batches
    for (let i = 0; i < prompts.length; i += concurrency) {
        const batch = prompts.slice(i, i + concurrency);
        
        const batchResults = await Promise.all(
            batch.map(async (prompt) => {
                const response = await client.complete({
                    provider,
                    apiKey,
                    prompt,
                    model: options.model,
                    systemPrompt: options.systemPrompt,
                    temperature: options.temperature
                });
                return response.content;
            })
        );
        
        results.push(...batchResults);
    }
    
    return results;
}

// Export singleton instance
export const aiClient = new AIClient();

