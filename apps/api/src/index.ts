// Load environment variables from .env file
import { config } from 'dotenv';

// Load .env from current directory (apps/api/.env)
config();

// Import logger first
import { logger } from './utils/logger.ts'

logger.info('Environment loaded', {
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Loaded' : '❌ Not found',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Not found'
});

import Fastify from 'fastify'
import cors from '@fastify/cors'
import contextPlugin from './plugins/context.ts'
import authPlugin from './middleware/auth.ts'
import rateLimitPlugin from './middleware/rate-limit.ts'
import swaggerPlugin from './plugins/swagger.ts'
import ideas from './routes/ideas.ts'
import briefs from './routes/briefs.ts'
import packs from './routes/packs.ts'
import rag from './routes/rag.ts'
import events from './routes/events.ts'
import settings from './routes/settings.ts'
import publishing from './routes/publishing.ts'
import twitterBot from './routes/twitter-bot.ts'
import auth from './routes/auth.ts'
import images from './routes/images.ts'

logger.info('Starting Content Multiplier API', {
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '3001'
});

const app = Fastify({ 
    logger: false, // Use our custom logger instead
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId'
})

// Register CORS plugin
await app.register(cors, {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) {
            callback(null, true);
            return;
        }
        
        // Allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3002',
            'https://content-multiplier-dec-01.vercel.app',
        ];
        
        // Check exact match
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        
        // Check pattern match for Vercel and Cloudflare
        if (origin.endsWith('.vercel.app') || origin.endsWith('.pages.dev')) {
            callback(null, true);
            return;
        }
        
        // Reject other origins
        logger.warn('CORS rejected origin', { origin });
        callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
})

// Health check endpoints (no auth required)
app.get('/healthz', async (request, reply) => {
    logger.debug('Healthz check requested')
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'content-multiplier-api',
        version: '1.0.0'
    }
})

app.get('/api/health', async (request, reply) => {
    logger.debug('API Health check requested')
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'content-multiplier-api',
        version: '1.0.0'
    }
})

// Migration endpoint - setup RAG tables with embeddings (JSONB for compatibility)
app.get('/api/migrate/rag', async (request, reply) => {
    logger.info('Running RAG tables migration...')
    try {
        const { q } = await import('./db.ts')
        
        // Create documents table if not exists
        await q(`CREATE TABLE IF NOT EXISTS documents (
            doc_id TEXT PRIMARY KEY,
            title TEXT,
            url TEXT,
            raw TEXT,
            author TEXT,
            published_date TIMESTAMPTZ,
            tags TEXT[],
            description TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )`)
        
        // Create doc_chunks table with JSONB embedding (works without pgvector)
        await q(`CREATE TABLE IF NOT EXISTS doc_chunks (
            chunk_id TEXT PRIMARY KEY,
            doc_id TEXT REFERENCES documents(doc_id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            embedding JSONB,
            chunk_index INTEGER,
            created_at TIMESTAMPTZ DEFAULT now()
        )`)
        
        // Add embedding column if not exists (for existing tables)
        await q(`ALTER TABLE doc_chunks ADD COLUMN IF NOT EXISTS embedding JSONB`)
        
        // Create indexes
        await q(`CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc_id ON doc_chunks(doc_id)`)
        await q(`CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding ON doc_chunks USING GIN(embedding)`)
        
        logger.info('RAG tables migration completed!')
        return {
            ok: true,
            message: 'RAG tables created/updated with JSONB embedding support',
            tables: ['documents', 'doc_chunks'],
            note: 'Using JSONB for embeddings (compatible with all PostgreSQL)'
        }
    } catch (error: any) {
        logger.error('RAG migration failed', { error: error.message })
        return reply.status(500).send({
            ok: false,
            error: error.message
        })
    }
})

// Migration endpoint - update documents table with new columns
app.get('/api/migrate/documents', async (request, reply) => {
    logger.info('Running documents table migration...')
    try {
        const { q } = await import('./db.ts')
        
        // Add new columns to documents table
        await q(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS author TEXT`)
        await q(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS published_date TIMESTAMPTZ`)
        await q(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[]`)
        await q(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT`)
        await q(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`)
        
        // Create index for better search
        await q(`CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags)`)
        await q(`CREATE INDEX IF NOT EXISTS idx_documents_author ON documents(author)`)
        
        logger.info('Documents table migration completed!')
        return {
            ok: true,
            message: 'Documents table updated with new columns',
            columns: ['author', 'published_date', 'tags', 'description', 'updated_at']
        }
    } catch (error: any) {
        logger.error('Documents migration failed', { error: error.message })
        return reply.status(500).send({
            ok: false,
            error: error.message
        })
    }
})

// Migration endpoint - run publishing tables migration
app.get('/api/migrate/publishing', async (request, reply) => {
    logger.info('Running publishing migration...')
    try {
        const { q } = await import('./db.ts')
        
        // Create publishing_credentials table
        await q(`CREATE TABLE IF NOT EXISTS publishing_credentials (
            credential_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'default',
            platform TEXT NOT NULL,
            credential_type TEXT NOT NULL,
            encrypted_credentials JSONB NOT NULL,
            metadata JSONB,
            is_active BOOLEAN DEFAULT true,
            expires_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )`)
        
        // Create oauth_states table
        await q(`CREATE TABLE IF NOT EXISTS oauth_states (
            state TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            code_verifier TEXT,
            redirect_uri TEXT,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        )`)
        
        // Create publishing_queue table
        await q(`CREATE TABLE IF NOT EXISTS publishing_queue (
            queue_id BIGSERIAL PRIMARY KEY,
            pack_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            content_type TEXT NOT NULL,
            content_data JSONB NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            scheduled_at TIMESTAMPTZ DEFAULT now(),
            published_at TIMESTAMPTZ,
            error_message TEXT,
            retry_count INTEGER DEFAULT 0,
            max_retries INTEGER DEFAULT 3,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )`)
        
        // Create publishing_results table
        await q(`CREATE TABLE IF NOT EXISTS publishing_results (
            result_id BIGSERIAL PRIMARY KEY,
            queue_id BIGINT,
            platform TEXT NOT NULL,
            external_id TEXT,
            external_url TEXT,
            metrics JSONB,
            published_at TIMESTAMPTZ DEFAULT now(),
            created_at TIMESTAMPTZ DEFAULT now()
        )`)
        
        // Create webhook_configurations table
        await q(`CREATE TABLE IF NOT EXISTS webhook_configurations (
            webhook_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            secret TEXT NOT NULL,
            events TEXT[] NOT NULL,
            headers JSONB,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        )`)
        
        // Create webhook_deliveries table
        await q(`CREATE TABLE IF NOT EXISTS webhook_deliveries (
            delivery_id BIGSERIAL PRIMARY KEY,
            webhook_id TEXT NOT NULL REFERENCES webhook_configurations(webhook_id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            payload JSONB NOT NULL,
            status TEXT NOT NULL,
            response_code INTEGER,
            response_body TEXT,
            attempts INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 3,
            next_retry_at TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT now()
        )`)
        
        // Add columns to content_packs if not exist
        try {
            await q(`ALTER TABLE content_packs ADD COLUMN IF NOT EXISTS publishing_status TEXT DEFAULT 'not_published'`)
        } catch (e) { /* column might already exist */ }
        
        try {
            await q(`ALTER TABLE content_packs ADD COLUMN IF NOT EXISTS last_published_at TIMESTAMPTZ`)
        } catch (e) { /* column might already exist */ }
        
        try {
            await q(`ALTER TABLE content_packs ADD COLUMN IF NOT EXISTS publishing_errors JSONB`)
        } catch (e) { /* column might already exist */ }
        
        // Create indexes
        await q(`CREATE INDEX IF NOT EXISTS idx_pub_creds_platform ON publishing_credentials(platform, is_active)`)
        await q(`CREATE INDEX IF NOT EXISTS idx_pub_queue_status ON publishing_queue(status, scheduled_at)`)
        await q(`CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at)`)
        await q(`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, status)`)
        await q(`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending'`)
        
        logger.info('Publishing migration completed successfully!')
        return { 
            ok: true, 
            message: 'Publishing tables created successfully!',
            tables: ['publishing_credentials', 'oauth_states', 'publishing_queue', 'publishing_results', 'webhook_configurations', 'webhook_deliveries']
        }
    } catch (error: any) {
        logger.error('Migration failed', { error: error.message })
        return reply.status(500).send({ 
            ok: false, 
            error: error.message 
        })
    }
})

// LLM Test endpoint - check if LLM is working
app.get('/api/llm/test', async (request, reply) => {
    logger.info('Testing LLM connection...')
    try {
        const { llm } = await import('./services/llm.ts')
        const { env } = await import('./env.ts')
        const { loadLLMSettings } = await import('./services/settingsStore.ts')
        
        const saved = loadLLMSettings()
        
        // Log available API keys (masked)
        const hasOpenAI = !!(env.OPENAI_API_KEY || process.env.OPENAI_API_KEY)
        const hasDeepSeek = !!(env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY)
        const hasGemini = !!(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY)
        
        logger.info('API Keys status', { 
            openai: hasOpenAI, 
            deepseek: hasDeepSeek, 
            gemini: hasGemini,
            savedProvider: saved?.provider,
            savedModel: saved?.model
        })
        
        // Test simple completion
        const startTime = Date.now()
        const result = await llm.completeText({
            model: 'deepseek-chat', // Force DeepSeek which has default key
            system: 'You are a helpful assistant. Respond briefly.',
            user: 'Say "LLM is working!" in Vietnamese.',
            temperature: 0.5
        })
        const duration = Date.now() - startTime
        
        logger.info('LLM test successful', { duration, resultLength: result.length })
        
        return {
            ok: true,
            message: 'LLM is working!',
            result: result.substring(0, 200),
            duration_ms: duration,
            config: {
                hasOpenAI,
                hasDeepSeek,
                hasGemini,
                savedProvider: saved?.provider || 'none',
                savedModel: saved?.model || 'none',
                defaultModel: env.LLM_MODEL || 'gpt-4o-mini'
            }
        }
    } catch (error: any) {
        logger.error('LLM test failed', { error: error.message })
        return reply.status(500).send({
            ok: false,
            error: error.message,
            hint: 'Check API keys in Railway Variables'
        })
    }
})

// Root endpoint - just return API info
app.get('/', async (request, reply) => {
    return { 
        name: 'Content Multiplier API',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            health: '/healthz',
            apiHealth: '/api/health',
            llmTest: '/api/llm/test',
            docs: '/api/docs'
        }
    }
})

// Register plugins
try {
    // Authentication plugin
    app.register(authPlugin);
    logger.info('Auth plugin registered');

    // Rate limiting (optional - enable in production)
    if (process.env.ENABLE_RATE_LIMIT === 'true') {
        app.register(rateLimitPlugin);
        logger.info('Rate limit plugin registered');
    }

    // Context plugin (backward compatibility)
    app.register(contextPlugin);
    logger.info('Context plugin registered');

    // Swagger/OpenAPI documentation
    app.register(swaggerPlugin);
    logger.info('Swagger plugin registered');
} catch (error) {
    logger.error('Failed to register plugins', { error: error instanceof Error ? error.message : 'Unknown' });
}

// Request/Response logging hook
app.addHook('onResponse', async (request, reply) => {
    const duration = reply.getResponseTime()
    logger.request(request, reply, Math.round(duration))
})

// Register routes
try {
    app.register(auth, { prefix: '/api/auth' });
    app.register(ideas, { prefix: '/api/ideas' });
    app.register(briefs, { prefix: '/api/briefs' });
    app.register(packs, { prefix: '/api/packs' });
    app.register(rag, { prefix: '/api/rag' });
    app.register(events, { prefix: '/api/events' });
    app.register(settings, { prefix: '/api/settings' });
    app.register(publishing, { prefix: '/api/publishing' });
    app.register(images, { prefix: '/api/images' });
    app.register(twitterBot);
    logger.info('All routes registered');
} catch (error) {
    logger.error('Failed to register routes', { error: error instanceof Error ? error.message : 'Unknown' });
}

// Error handler
app.setErrorHandler(async (err, req, reply) => {
    // Don't log rate limit or auth errors as errors
    if (err.message === 'Rate limit exceeded' || err.message === 'Unauthorized' || err.message === 'Forbidden') {
        return // Already handled
    }

    logger.error('Unhandled error', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.url,
        method: req.method
    });

    reply.status(500).send({ 
        ok: false, 
        error: 'internal_error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
const port = Number(process.env.PORT || 3001);
const host = '0.0.0.0';

logger.info(`Attempting to start server on ${host}:${port}`);

app.listen({ port, host })
    .then((address) => {
        logger.info(`Server successfully listening`, { address });
        logger.info(`Health check available`, { url: `${address}/api/health` });
        logger.info(`API Documentation available`, { url: `${address}/api/docs` });
    })
    .catch((error) => { 
        logger.error('Failed to start server', { error: error.message });
        process.exit(1); 
    });
