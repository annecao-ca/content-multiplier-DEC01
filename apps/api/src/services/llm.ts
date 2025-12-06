import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../env.ts'
import { loadLLMSettings } from './settingsStore.ts'
import type { LLMClient, LLMParams } from '../../../../packages/utils/llm.ts'

// Default models used when caller doesn't specify a model explicitly
const DEFAULT_MODELS = {
    openai: {
        json: env.OPENAI_MODEL || 'gpt-4o-mini',
        embedding: env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
    },
    deepseek: {
        json: 'deepseek-chat',
        embedding: 'deepseek-chat' // DeepSeek doesn't have separate embedding models
    },
    anthropic: {
        json: 'claude-3-5-sonnet-20241022',
        embedding: 'claude-3-5-sonnet-20241022' // Anthropic doesn't have embedding models
    },
    gemini: {
        json: 'gemini-2.0-flash-lite',
        embedding: 'text-embedding-004'
    },
    grok: {
        json: 'grok-beta',
        embedding: 'grok-beta' // Grok doesn't have separate embedding models
    }
}

// LLM Provider configurations
const PROVIDER_CONFIGS = {
    openai: {
        createClient: (apiKey: string) => new OpenAI({ apiKey }),
        baseUrl: null
    },
    deepseek: {
        createClient: (apiKey: string, baseUrl?: string) => new OpenAI({
            apiKey,
            baseURL: baseUrl || 'https://api.deepseek.com'
        }),
        baseUrl: 'https://api.deepseek.com'
    },
    anthropic: {
        createClient: (apiKey: string) => {
            // For Anthropic, we'd need a different client implementation
            // For demo, we'll use OpenAI client as a proxy
            return new OpenAI({ apiKey, baseURL: 'https://api.anthropic.com' })
        },
        baseUrl: 'https://api.anthropic.com'
    },
    gemini: {
        createClient: (apiKey: string, baseUrl?: string) => {
            // For Gemini, we'd need a different client implementation
            // For demo, we'll use OpenAI client as a proxy
            return new OpenAI({ apiKey, baseURL: baseUrl || 'https://generativelanguage.googleapis.com' })
        },
        baseUrl: 'https://generativelanguage.googleapis.com'
    },
    grok: {
        createClient: (apiKey: string, baseUrl?: string) => {
            // For Grok, we'd need a different client implementation
            // For demo, we'll use OpenAI client as a proxy
            return new OpenAI({ apiKey, baseURL: baseUrl || 'https://api.x.ai' })
        },
        baseUrl: 'https://api.x.ai'
    }
}

export class MultiProviderLLM implements LLMClient {
    private getProviderConfig(provider: string = 'openai') {
        return PROVIDER_CONFIGS[provider as keyof typeof PROVIDER_CONFIGS] || PROVIDER_CONFIGS.openai
    }

    private getDefaultModel(provider: string = 'openai', type: 'json' | 'embedding' = 'json') {
        const models = DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS] || DEFAULT_MODELS.openai
        return models[type]
    }

    private async withRetry<T>(fn: () => Promise<T>, retries: number = 3): Promise<T> {
        let lastError: any;
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${i + 1} failed. Retrying...`, error);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff-ish
            }
        }
        throw lastError;
    }

    async completeText(p: LLMParams): Promise<string> {
        return this.withRetry(async () => {
            const saved = loadLLMSettings()
            const inferredProvider = p.model?.includes('deepseek') ? 'deepseek' :
                p.model?.includes('claude') ? 'anthropic' :
                    p.model?.includes('gemini') ? 'gemini' :
                        p.model?.includes('grok') ? 'grok' : undefined

            const provider = inferredProvider || saved?.provider || 'openai'
            const temperature = p.temperature ?? 0.7;

            if (provider === 'gemini') {
                const apiKey = env.GEMINI_API_KEY || saved?.apiKey || '';
                if (!apiKey) throw new Error('Gemini API key not configured');

                const genAI = new GoogleGenerativeAI(apiKey);
                const modelName = p.model || saved?.model || this.getDefaultModel('gemini', 'json');
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: temperature
                    }
                });

                const prompt = `${p.system ? p.system + '\n\n' : ''}${p.user}`;

                try {
                    const result = await model.generateContent(prompt);
                    return result.response.text();
                } catch (error) {
                    console.error('Gemini API error:', error);
                    throw error;
                }
            }

            const config = this.getProviderConfig(provider)

            // Determine API Key
            let apiKey = ''
            if (provider === 'openai') {
                apiKey = saved?.apiKey || env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
            } else if (provider === 'deepseek') {
                apiKey = saved?.apiKey || process.env.DEEPSEEK_API_KEY || ''
            } else {
                apiKey = saved?.apiKey || env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
            }

            if (!apiKey) throw new Error(`API key not configured for provider ${provider}`);

            const client = config.createClient(apiKey, config.baseUrl || undefined)

            try {
                const response = await client.chat.completions.create({
                    model: p.model || saved?.model || this.getDefaultModel(provider, 'json'),
                    messages: [
                        ...(p.system ? [{ role: 'system' as const, content: p.system }] : []),
                        { role: 'user' as const, content: p.user }
                    ],
                    temperature: temperature,
                })
                return response.choices[0]?.message?.content || ''
            } catch (error) {
                console.error('LLM API error:', error)
                throw error;
            }
        }, p.maxRetries ?? 3);
    }

    async completeJSON(p: LLMParams): Promise<any> {
        return this.withRetry(async () => {
            const saved = loadLLMSettings()
            const inferredProvider = p.model?.includes('deepseek') ? 'deepseek' :
                p.model?.includes('claude') ? 'anthropic' :
                    p.model?.includes('gemini') ? 'gemini' :
                        p.model?.includes('grok') ? 'grok' : undefined

            const provider = inferredProvider || saved?.provider || 'openai'
            const temperature = p.temperature ?? 0.3; // Lower default for JSON

            if (provider === 'gemini') {
                const apiKey = env.GEMINI_API_KEY || saved?.apiKey || '';
                if (!apiKey) throw new Error('Gemini API key not configured');

                const genAI = new GoogleGenerativeAI(apiKey);
                const modelName = p.model || saved?.model || this.getDefaultModel('gemini', 'json');
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: temperature
                    }
                });

                const prompt = `${p.system ? p.system + '\n\n' : ''}${p.user}`;

                try {
                    const result = await model.generateContent(prompt);
                    const text = result.response.text();
                    return JSON.parse(text);
                } catch (error) {
                    console.error('Gemini API error:', error);
                    throw error;
                }
            }

            const config = this.getProviderConfig(provider)
            // Determine API Key
            let apiKey = ''
            if (provider === 'openai') {
                apiKey = saved?.apiKey || env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
            } else if (provider === 'deepseek') {
                apiKey = saved?.apiKey || process.env.DEEPSEEK_API_KEY || ''
            } else {
                apiKey = saved?.apiKey || env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
            }

            const client = config.createClient(apiKey, saved?.baseUrl || undefined)

            const systemMsg = p.system
                ? `${p.system}\n\nYou must respond with valid JSON only.`
                : 'Respond with valid JSON only.'

            try {
                const response = await client.chat.completions.create({
                    model: p.model || saved?.model || this.getDefaultModel(provider, 'json'),
                    messages: [
                        { role: 'system' as const, content: systemMsg },
                        { role: 'user' as const, content: p.user }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: temperature
                })
                const content = response.choices[0]?.message?.content || '{}'
                return JSON.parse(content)
            } catch (error) {
                console.error('LLM API error:', error)
                throw error;
            }
        }, p.maxRetries ?? 3);
    }

    async embed(input: string[]): Promise<number[][]> {
        const saved = loadLLMSettings()
        // Check env.EMBEDDING_PROVIDER first, then saved settings, default to openai
        const provider = env.EMBEDDING_PROVIDER || saved?.provider || 'openai';

        // Special handling for Gemini embeddings (separate SDK)
        if (provider === 'gemini') {
            const apiKey = env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');

            const genAI = new GoogleGenerativeAI(apiKey);
            // Use text-embedding-004 as default for Gemini
            const modelName = env.EMBEDDING_MODEL === 'text-embedding-3-small'
                ? 'text-embedding-004'
                : (env.EMBEDDING_MODEL || 'text-embedding-004');
            const model = genAI.getGenerativeModel({ model: modelName });

            try {
                const embeddings = await Promise.all(input.map(async (text) => {
                    const result = await model.embedContent(text);
                    return result.embedding.values;
                }));
                return embeddings;
            } catch (error) {
                console.error('Gemini Embedding API error:', error);
                throw error;
            }
        }

        // Generic OpenAI-compatible providers (openai, deepseek, anthropic proxy, grok, etc.)
        const config = this.getProviderConfig(provider)

        // Determine API Key based on provider
        let apiKey = ''
        if (provider === 'openai') {
            apiKey = saved?.apiKey || env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
        } else {
            // Fallback
            apiKey = saved?.apiKey || env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
        }

        if (!apiKey) {
            throw new Error(`Embedding API key not configured for provider "${provider}". Please set the appropriate environment variable (e.g. OPENAI_API_KEY).`)
        }

        const client = config.createClient(apiKey, config.baseUrl || undefined)

        // Determine Embedding Model
        const embeddingModel = env.EMBEDDING_MODEL || this.getDefaultModel(provider, 'embedding');

        try {
            const response = await client.embeddings.create({
                model: embeddingModel,
                input,
            })
            return response.data.map(item => item.embedding as number[])
        } catch (error) {
            console.error(`Embedding API error (${provider}):`, error)
            throw error
        }
    }
}

export const llm = new MultiProviderLLM()
