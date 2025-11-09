import Fastify from 'fastify';

console.log('🚀 Starting Content Multiplier API (JavaScript)...');
console.log('📦 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Port:', process.env.PORT || '3001');

const app = Fastify({ 
    logger: true
});

// CORS headers
app.addHook('preHandler', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', '*');
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (request.method === 'OPTIONS') {
        reply.status(200).send();
        return;
    }
});

// Health check endpoints
app.get('/api/health', async (request, reply) => {
    console.log('🏥 Health check requested');
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'content-multiplier-api',
        version: '1.0.0'
    };
});

app.get('/health', async (request, reply) => {
    console.log('🏥 Root health check requested');
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'content-multiplier-api'
    };
});

// Basic info endpoint
app.get('/', async (request, reply) => {
    return { 
        name: 'Content Multiplier API',
        status: 'running',
        timestamp: new Date().toISOString()
    };
});

// Error handler
app.setErrorHandler(async (err, req, reply) => {
    console.error('❌ Error:', err);
    reply.status(500).send({ ok: false, error: 'internal_error' });
});

// Start server
const port = Number(process.env.PORT || 3001);
const host = '0.0.0.0';

console.log(`🌐 Attempting to start server on ${host}:${port}`);
console.log('🔍 Available environment variables:', Object.keys(process.env).filter(k => k.includes('PORT') || k.includes('HOST')));

app.listen({ port, host, listenTextResolver: (address) => `Server listening at ${address}` })
    .then((address) => {
        console.log(`✅ Server successfully listening at ${address}`);
        console.log(`🏥 Health check available at: ${address}/api/health`);
    })
    .catch((error) => { 
        console.error('❌ Failed to start server:', error);
        process.exit(1); 
    });