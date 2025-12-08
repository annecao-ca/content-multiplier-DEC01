/**
 * Multi-Provider Embedding Client
 * Supports OpenAI, Cohere, and Hugging Face embeddings
 */

import OpenAI from 'openai';
import { env } from '../env.ts';

// ============================================
// TYPES & INTERFACES
// ============================================

/**
 * Embedding result with metadata
 */
export interface EmbeddingResult {
    /** Embedding vectors (array of arrays) */
    embeddings: number[][];
    /** Provider used */
    provider: string;
    /** Model used */
    model: string;
    /** Dimensions of embeddings */
    dimensions: number;
    /** Number of tokens processed (if available) */
    tokens?: number;
}

/**
 * Base interface for all embedding providers
 */
export interface EmbeddingProvider {
    /** Provider name */
    readonly name: string;
    
    /** Default model for this provider */
    readonly defaultModel: string;
    
    /** Embedding dimensions for default model */
    readonly defaultDimensions: number;
    
    /**
     * Create embeddings from text inputs
     * @param texts - Array of text strings to embed
     * @param model - Optional model override
     * @returns Promise with embedding vectors
     */
    embed(texts: string[], model?: string): Promise<number[][]>;
    
    /**
     * Get embedding dimensions for a model
     * @param model - Model name
     * @returns Dimensions
     */
    getDimensions(model?: string): number;
}

// ============================================
// OPENAI PROVIDER
// ============================================

export interface OpenAIProviderConfig {
    apiKey: string;
    defaultModel?: string;
}

export class OpenAIProvider implements EmbeddingProvider {
    readonly name = 'openai';
    readonly defaultModel = 'text-embedding-3-small';
    readonly defaultDimensions = 1536;
    
    private client: OpenAI;
    private config: OpenAIProviderConfig;
    
    constructor(config: OpenAIProviderConfig) {
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.config = config;
        this.client = new OpenAI({ apiKey: config.apiKey });
    }
    
    async embed(texts: string[], model?: string): Promise<number[][]> {
        const embeddingModel = model || this.config.defaultModel || this.defaultModel;
        
        try {
            const response = await this.client.embeddings.create({
                model: embeddingModel,
                input: texts,
            });
            
            return response.data.map(item => item.embedding);
        } catch (error: any) {
            throw new Error(`OpenAI embedding error: ${error.message}`);
        }
    }
    
    getDimensions(model?: string): number {
        const m = model || this.config.defaultModel || this.defaultModel;
        
        // OpenAI embedding dimensions
        const dimensions: Record<string, number> = {
            'text-embedding-ada-002': 1536,
            'text-embedding-3-small': 1536,
            'text-embedding-3-large': 3072,
        };
        
        return dimensions[m] || this.defaultDimensions;
    }
}

// ============================================
// COHERE PROVIDER
// ============================================

export interface CohereProviderConfig {
    apiKey: string;
    defaultModel?: string;
}

export class CohereProvider implements EmbeddingProvider {
    readonly name = 'cohere';
    readonly defaultModel = 'embed-english-v3.0';
    readonly defaultDimensions = 1024;
    
    private apiKey: string;
    private config: CohereProviderConfig;
    private baseUrl = 'https://api.cohere.ai/v1';
    
    constructor(config: CohereProviderConfig) {
        if (!config.apiKey) {
            throw new Error('Cohere API key is required');
        }
        this.config = config;
        this.apiKey = config.apiKey;
    }
    
    async embed(texts: string[], model?: string): Promise<number[][]> {
        const embeddingModel = model || this.config.defaultModel || this.defaultModel;
        
        try {
            const response = await fetch(`${this.baseUrl}/embed`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    texts: texts,
                    model: embeddingModel,
                    input_type: 'search_document', // or 'search_query'
                    truncate: 'END',
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Cohere API error: ${error.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.embeddings;
        } catch (error: any) {
            throw new Error(`Cohere embedding error: ${error.message}`);
        }
    }
    
    getDimensions(model?: string): number {
        const m = model || this.config.defaultModel || this.defaultModel;
        
        // Cohere embedding dimensions
        const dimensions: Record<string, number> = {
            'embed-english-v3.0': 1024,
            'embed-english-light-v3.0': 384,
            'embed-multilingual-v3.0': 1024,
            'embed-multilingual-light-v3.0': 384,
        };
        
        return dimensions[m] || this.defaultDimensions;
    }
}

// ============================================
// HUGGING FACE PROVIDER
// ============================================

export interface HuggingFaceProviderConfig {
    apiKey: string;
    defaultModel?: string;
    useInferenceAPI?: boolean; // Use Inference API or local model
}

export class HuggingFaceProvider implements EmbeddingProvider {
    readonly name = 'huggingface';
    readonly defaultModel = 'sentence-transformers/all-MiniLM-L6-v2';
    readonly defaultDimensions = 384;
    
    private apiKey: string;
    private config: HuggingFaceProviderConfig;
    private baseUrl = 'https://api-inference.huggingface.co/pipeline/feature-extraction';
    
    constructor(config: HuggingFaceProviderConfig) {
        if (!config.apiKey) {
            throw new Error('Hugging Face API key is required');
        }
        this.config = config;
        this.apiKey = config.apiKey;
    }
    
    async embed(texts: string[], model?: string): Promise<number[][]> {
        const embeddingModel = model || this.config.defaultModel || this.defaultModel;
        
        try {
            // Hugging Face Inference API
            const response = await fetch(
                `${this.baseUrl}/${embeddingModel}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inputs: texts,
                        options: {
                            wait_for_model: true,
                        },
                    }),
                }
            );
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Hugging Face API error: ${error.error || response.statusText}`);
            }
            
            const data = await response.json();
            
            // Handle both single and batch responses
            if (Array.isArray(data) && Array.isArray(data[0])) {
                return data as number[][];
            } else if (Array.isArray(data) && typeof data[0] === 'number') {
                // Single embedding
                return [data as number[]];
            } else {
                throw new Error('Unexpected response format from Hugging Face');
            }
        } catch (error: any) {
            throw new Error(`Hugging Face embedding error: ${error.message}`);
        }
    }
    
    getDimensions(model?: string): number {
        const m = model || this.config.defaultModel || this.defaultModel;
        
        // Hugging Face embedding dimensions (common models)
        const dimensions: Record<string, number> = {
            'sentence-transformers/all-MiniLM-L6-v2': 384,
            'sentence-transformers/all-mpnet-base-v2': 768,
            'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2': 384,
            'intfloat/multilingual-e5-base': 768,
            'BAAI/bge-large-en-v1.5': 1024,
        };
        
        return dimensions[m] || this.defaultDimensions;
    }
}

// ============================================
// EMBEDDING CLIENT (FACADE)
// ============================================

export type ProviderType = 'openai' | 'cohere' | 'huggingface';

export interface EmbeddingClientConfig {
    provider: ProviderType;
    openai?: OpenAIProviderConfig;
    cohere?: CohereProviderConfig;
    huggingface?: HuggingFaceProviderConfig;
}

/**
 * Multi-provider Embedding Client
 * 
 * Unified interface for creating embeddings from multiple providers
 */
export class EmbeddingClient {
    private provider: EmbeddingProvider;
    private providerType: ProviderType;
    
    constructor(config: EmbeddingClientConfig) {
        this.providerType = config.provider;
        
        switch (config.provider) {
            case 'openai':
                if (!config.openai) {
                    throw new Error('OpenAI config is required when using OpenAI provider');
                }
                this.provider = new OpenAIProvider(config.openai);
                break;
                
            case 'cohere':
                if (!config.cohere) {
                    throw new Error('Cohere config is required when using Cohere provider');
                }
                this.provider = new CohereProvider(config.cohere);
                break;
                
            case 'huggingface':
                if (!config.huggingface) {
                    throw new Error('Hugging Face config is required when using Hugging Face provider');
                }
                this.provider = new HuggingFaceProvider(config.huggingface);
                break;
                
            default:
                throw new Error(`Unsupported provider: ${config.provider}`);
        }
    }
    
    /**
     * Create embeddings from text inputs
     * @param texts - Array of text strings
     * @param model - Optional model override
     * @returns EmbeddingResult with vectors and metadata
     */
    async embed(texts: string[], model?: string): Promise<EmbeddingResult> {
        const embeddings = await this.provider.embed(texts, model);
        const dimensions = this.provider.getDimensions(model);
        
        return {
            embeddings,
            provider: this.provider.name,
            model: model || this.provider.defaultModel,
            dimensions,
        };
    }
    
    /**
     * Get the underlying provider
     */
    getProvider(): EmbeddingProvider {
        return this.provider;
    }
    
    /**
     * Get provider type
     */
    getProviderType(): ProviderType {
        return this.providerType;
    }
    
    /**
     * Get default dimensions for current provider/model
     */
    getDimensions(model?: string): number {
        return this.provider.getDimensions(model);
    }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Create EmbeddingClient from environment variables
 */
export function createEmbeddingClientFromEnv(): EmbeddingClient {
    const provider = (env.EMBEDDING_PROVIDER || 'openai') as ProviderType;
    
    const config: EmbeddingClientConfig = {
        provider,
    };
    
    switch (provider) {
        case 'openai':
            config.openai = {
                apiKey: env.OPENAI_API_KEY || '',
                defaultModel: env.EMBEDDING_MODEL || 'text-embedding-3-small',
            };
            break;
            
        case 'cohere':
            config.cohere = {
                apiKey: env.COHERE_API_KEY || '',
                defaultModel: env.COHERE_EMBEDDING_MODEL || 'embed-english-v3.0',
            };
            break;
            
        case 'huggingface':
            config.huggingface = {
                apiKey: env.HUGGINGFACE_API_KEY || '',
                defaultModel: env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
            };
            break;
    }
    
    return new EmbeddingClient(config);
}

/**
 * Create EmbeddingClient with explicit config
 */
export function createEmbeddingClient(
    provider: ProviderType,
    apiKey: string,
    model?: string
): EmbeddingClient {
    const config: EmbeddingClientConfig = { provider };
    
    switch (provider) {
        case 'openai':
            config.openai = { apiKey, defaultModel: model };
            break;
        case 'cohere':
            config.cohere = { apiKey, defaultModel: model };
            break;
        case 'huggingface':
            config.huggingface = { apiKey, defaultModel: model };
            break;
    }
    
    return new EmbeddingClient(config);
}















