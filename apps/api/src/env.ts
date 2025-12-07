export const env = {
    DATABASE_URL: process.env.DATABASE_URL || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    // DeepSeek API key (OpenAI-compatible endpoint at https://api.deepseek.com)
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || 'sk-669989e31dd14e56bdcca4b9232a5481',
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',
    PORT: process.env.PORT || '3001',
    // Multi-provider embedding support
    // Supported providers: 'openai' | 'deepseek' | 'anthropic' | 'gemini' | 'grok' | 'cohere' | 'huggingface'
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || 'openai',
    COHERE_API_KEY: process.env.COHERE_API_KEY || '',
    COHERE_EMBEDDING_MODEL: process.env.COHERE_EMBEDDING_MODEL || 'embed-english-v3.0',
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || '',
    HUGGINGFACE_EMBEDDING_MODEL: process.env.HUGGINGFACE_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
