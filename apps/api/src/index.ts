// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
const envPath = resolve(process.cwd(), '../../.env');
config({ path: envPath });

console.log('🔑 Loading environment from:', envPath);
console.log('🔑 GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Not found');

import Fastify from 'fastify'
import cors from '@fastify/cors'
import contextPlugin from './plugins/context.ts'
import ideas from './routes/ideas.ts'
import briefs from './routes/briefs.ts'
import packs from './routes/packs.ts'
import rag from './routes/rag.ts'
import events from './routes/events.ts'
import settings from './routes/settings.ts'
import publishing from './routes/publishing.ts'
import twitterBot from './routes/twitter-bot.ts'

console.log('🚀 Starting Content Multiplier API...')
console.log('📦 Environment:', process.env.NODE_ENV || 'development')
console.log('🔧 API Port:', process.env.PORT || '3001')

const app = Fastify({ 
    logger: true
})

// Register CORS plugin
await app.register(cors, {
    origin: [
        // Local development frontends
        'http://localhost:3000',
        'http://localhost:3002',
        // Cloudflare Pages preview URLs
        'https://*.pages.dev',
        'https://content-multiplier.pages.dev',
        /\.pages\.dev$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
})

// Health check endpoints
app.get('/healthz', async (request, reply) => {
    console.log('🏥 Healthz check requested')
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'content-multiplier-api',
        version: '1.0.0'
    }
})

app.get('/api/health', async (request, reply) => {
    console.log('🏥 API Health check requested')
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
            apiHealth: '/api/health'
        }
    }
})

// Register context plugin
try {
    app.register(contextPlugin);
    console.log('✅ Context plugin registered');
} catch (error) {
    console.error('❌ Failed to register context plugin:', error);
}

// Register routes
try {
    app.register(ideas, { prefix: '/api/ideas' });
    app.register(briefs, { prefix: '/api/briefs' });
    app.register(packs, { prefix: '/api/packs' });
    app.register(rag, { prefix: '/api/rag' });
    app.register(events, { prefix: '/api/events' });
    app.register(settings, { prefix: '/api/settings' });
    app.register(publishing, { prefix: '/api/publishing' });
    app.register(twitterBot);
    console.log('✅ All routes registered');
} catch (error) {
    console.error('❌ Failed to register routes:', error);
}

// Error handler
app.setErrorHandler(async (err, req, reply) => {
    console.error('❌ Error:', err);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);
    reply.status(500).send({ 
        ok: false, 
        error: 'internal_error',
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
const port = Number(process.env.PORT || 3001);
const host = '0.0.0.0';

console.log(`🌐 Attempting to start server on ${host}:${port}`);

app.listen({ port, host })
    .then((address) => {
        console.log(`✅ Server successfully listening at ${address}`);
        console.log(`🏥 Health check available at: ${address}/api/health`);
    })
    .catch((error) => { 
        console.error('❌ Failed to start server:', error);
        process.exit(1); 
    });