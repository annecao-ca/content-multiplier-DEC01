import Fastify from 'fastify'
import proxy from '@fastify/http-proxy'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Starting Content Multiplier...')
console.log('📦 Environment:', process.env.NODE_ENV || 'development')
console.log('🔧 Port:', process.env.PORT || '3001')

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
        service: 'content-multiplier',
        version: '1.0.0'
    }
})

app.get('/health', async (request, reply) => {
    console.log('🏥 Root health check requested')
    return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'content-multiplier'
    }
})

// Start Next.js server internally on port 3000
const NEXTJS_PORT = 3000
const nextjsPath = path.join(__dirname, '../../web')
console.log('🌐 Starting Next.js server on port', NEXTJS_PORT)

const nextjs = spawn('npm', ['start', '--', '-p', NEXTJS_PORT.toString()], {
    cwd: nextjsPath,
    shell: true,
    stdio: 'inherit'
})

nextjs.on('error', (error) => {
    console.error('❌ Failed to start Next.js server:', error)
})

// Wait a bit for Next.js to start
await new Promise(resolve => setTimeout(resolve, 3000))
console.log('✅ Next.js server should be running')

// Proxy all non-API routes to Next.js
app.register(proxy, {
    upstream: `http://localhost:${NEXTJS_PORT}`,
    prefix: '/',
    rewritePrefix: '/',
    http2: false,
    preHandler: (request, reply, done) => {
        // Only proxy if NOT an API route
        if (request.url.startsWith('/api/') && !request.url.startsWith('/api/_next')) {
            done(new Error('skip'))
        } else {
            done()
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