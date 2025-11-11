import Fastify from 'fastify'
import cors from '@fastify/cors'

console.log('🚀 Starting Content Multiplier API...')
console.log('📦 Environment:', process.env.NODE_ENV || 'development')
console.log('🔧 API Port:', process.env.PORT || '3001')

const app = Fastify({ 
    logger: true
})

// Register CORS plugin
await app.register(cors, {
    origin: [
        'http://localhost:3000',
        'https://*.pages.dev', // Cloudflare Pages preview URLs
        'https://content-multiplier.pages.dev', // Your Cloudflare Pages domain
        /\.pages\.dev$/, // All Cloudflare Pages domains
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

// Error handler
app.setErrorHandler(async (err, req, reply) => {
    console.error('❌ Error:', err);
    reply.status(500).send({ ok: false, error: 'internal_error' });
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