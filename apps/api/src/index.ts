import Fastify from 'fastify'
import proxy from '@fastify/http-proxy'

console.log('🚀 Starting Content Multiplier API...')
console.log('📦 Environment:', process.env.NODE_ENV || 'development')
console.log('🔧 API Port:', process.env.PORT || '3001')

const app = Fastify({ 
    logger: true
})

// CORS headers
app.addHook('preHandler', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    if (request.method === 'OPTIONS') {
        reply.status(200).send()
        return
    }
})

// Health check endpoints (must be BEFORE proxy)
app.get('/api/health', async (request, reply) => {
    console.log('🏥 Health check requested')
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'content-multiplier-api',
        version: '1.0.0'
    }
})

app.get('/health', async (request, reply) => {
    console.log('🏥 Root health check requested')
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'content-multiplier-api'
    }
})

// Proxy all non-API routes to Next.js server (running on port 3000)
const NEXTJS_PORT = process.env.NEXTJS_PORT || 3000
console.log('🌐 Proxying frontend requests to Next.js on port', NEXTJS_PORT)

try {
    await app.register(proxy, {
        upstream: `http://localhost:${NEXTJS_PORT}`,
        prefix: '/',
        rewritePrefix: '/',
        http2: false,
        preHandler: (request, reply, done) => {
            // Skip proxy for API routes - handle them directly
            if (request.url.startsWith('/api/') && !request.url.startsWith('/api/_next')) {
                done(new Error('skip'))
            } else {
                done()
            }
        }
    })
    console.log('✅ Proxy to Next.js registered')
} catch (error) {
    console.warn('⚠️ Could not register proxy (Next.js may not be running yet):', error.message)
}

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