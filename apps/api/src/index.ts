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
