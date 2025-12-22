/**
 * Rate Limiting Middleware
 * Prevents abuse and ensures fair usage
 */

import { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { logger } from '../utils/logger.ts'

interface RateLimitConfig {
    windowMs: number           // Time window in milliseconds
    maxRequests: number        // Max requests per window
    keyGenerator?: (req: FastifyRequest) => string
    skipFailedRequests?: boolean
    skipSuccessfulRequests?: boolean
    message?: string
}

interface RateLimitEntry {
    count: number
    resetTime: number
}

// In-memory store (for single instance)
// For production with multiple instances, use Redis
class MemoryStore {
    private store: Map<string, RateLimitEntry> = new Map()
    private cleanupInterval: NodeJS.Timeout

    constructor() {
        // Cleanup expired entries every minute
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }

    private cleanup(): void {
        const now = Date.now()
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetTime <= now) {
                this.store.delete(key)
            }
        }
    }

    get(key: string): RateLimitEntry | undefined {
        return this.store.get(key)
    }

    set(key: string, entry: RateLimitEntry): void {
        this.store.set(key, entry)
    }

    increment(key: string, windowMs: number): RateLimitEntry {
        const now = Date.now()
        const existing = this.store.get(key)

        if (existing && existing.resetTime > now) {
            existing.count++
            return existing
        }

        const newEntry: RateLimitEntry = {
            count: 1,
            resetTime: now + windowMs
        }
        this.store.set(key, newEntry)
        return newEntry
    }

    destroy(): void {
        clearInterval(this.cleanupInterval)
        this.store.clear()
    }
}

// Global store instance
const store = new MemoryStore()

// Default key generator: use IP + user ID if authenticated
function defaultKeyGenerator(req: FastifyRequest): string {
    const userId = (req as any).user?.sub
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    return userId ? `user:${userId}` : `ip:${ip}`
}

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
    // Standard API endpoints
    standard: {
        windowMs: 60 * 1000,    // 1 minute
        maxRequests: 100,
        message: 'Too many requests. Please wait a moment and try again.'
    },
    
    // AI generation endpoints (expensive)
    aiGeneration: {
        windowMs: 60 * 1000,    // 1 minute
        maxRequests: 10,
        message: 'AI generation rate limit reached. Please wait before generating more content.'
    },
    
    // Authentication endpoints
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        message: 'Too many login attempts. Please try again in 15 minutes.'
    },
    
    // Bulk operations
    bulk: {
        windowMs: 60 * 1000,    // 1 minute
        maxRequests: 5,
        message: 'Bulk operation rate limit reached. Please wait before performing more bulk operations.'
    },
    
    // Webhook endpoints
    webhook: {
        windowMs: 60 * 1000,    // 1 minute
        maxRequests: 1000,      // Higher limit for webhooks
        message: 'Webhook rate limit reached.'
    }
}

// Create rate limiter middleware
export function createRateLimiter(config: Partial<RateLimitConfig> = {}): (req: FastifyRequest, reply: FastifyReply) => Promise<void> {
    const fullConfig: RateLimitConfig = {
        windowMs: 60 * 1000,
        maxRequests: 100,
        keyGenerator: defaultKeyGenerator,
        skipFailedRequests: false,
        skipSuccessfulRequests: false,
        message: 'Too many requests. Please try again later.',
        ...config
    }

    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
        const key = fullConfig.keyGenerator!(req)
        const entry = store.increment(key, fullConfig.windowMs)
        
        // Set rate limit headers
        const remaining = Math.max(0, fullConfig.maxRequests - entry.count)
        const resetTime = Math.ceil(entry.resetTime / 1000)
        
        reply.header('X-RateLimit-Limit', fullConfig.maxRequests)
        reply.header('X-RateLimit-Remaining', remaining)
        reply.header('X-RateLimit-Reset', resetTime)

        if (entry.count > fullConfig.maxRequests) {
            const retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000)
            reply.header('Retry-After', retryAfter)
            
            logger.warn('Rate limit exceeded', {
                key,
                count: entry.count,
                limit: fullConfig.maxRequests,
                path: req.url
            })

            reply.status(429).send({
                ok: false,
                error: 'rate_limit_exceeded',
                message: fullConfig.message,
                retryAfter
            })
            throw new Error('Rate limit exceeded')
        }
    }
}

// Global rate limiter plugin
const rateLimitPlugin: FastifyPluginAsync<{ config?: Partial<RateLimitConfig> }> = async (app, opts) => {
    const limiter = createRateLimiter(opts.config || rateLimitConfigs.standard)

    app.addHook('onRequest', async (request, reply) => {
        // Skip rate limiting for health checks
        if (request.url === '/healthz' || request.url === '/api/health') {
            return
        }
        
        await limiter(request, reply)
    })
}

export default fp(rateLimitPlugin, {
    name: 'rate-limit-plugin'
})

// Specific rate limiters for different route types
export const standardRateLimit = createRateLimiter(rateLimitConfigs.standard)
export const aiGenerationRateLimit = createRateLimiter(rateLimitConfigs.aiGeneration)
export const authRateLimit = createRateLimiter(rateLimitConfigs.auth)
export const bulkRateLimit = createRateLimiter(rateLimitConfigs.bulk)
export const webhookRateLimit = createRateLimiter(rateLimitConfigs.webhook)

