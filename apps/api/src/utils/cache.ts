/**
 * Caching Utility
 * Supports both in-memory and Redis caching
 */

import { logger } from './logger.ts'

interface CacheEntry<T> {
    value: T
    expiresAt: number
}

interface CacheConfig {
    defaultTTL: number         // seconds
    maxEntries: number         // max entries for memory cache
    prefix: string
}

// In-memory cache implementation
class MemoryCache {
    private cache: Map<string, CacheEntry<any>> = new Map()
    private config: CacheConfig
    private cleanupInterval: NodeJS.Timeout

    constructor(config: Partial<CacheConfig> = {}) {
        this.config = {
            defaultTTL: 3600,      // 1 hour
            maxEntries: 10000,
            prefix: 'cm:',
            ...config
        }

        // Cleanup expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
    }

    private cleanup(): void {
        const now = Date.now()
        let removed = 0

        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt <= now) {
                this.cache.delete(key)
                removed++
            }
        }

        if (removed > 0) {
            logger.debug('Cache cleanup completed', { removed, remaining: this.cache.size })
        }
    }

    private enforceMaxEntries(): void {
        if (this.cache.size >= this.config.maxEntries) {
            // Remove oldest entries (LRU-like behavior)
            const entriesToRemove = Math.floor(this.config.maxEntries * 0.1)
            const keys = Array.from(this.cache.keys()).slice(0, entriesToRemove)
            keys.forEach(key => this.cache.delete(key))
        }
    }

    private prefixKey(key: string): string {
        return `${this.config.prefix}${key}`
    }

    async get<T>(key: string): Promise<T | null> {
        const prefixedKey = this.prefixKey(key)
        const entry = this.cache.get(prefixedKey)

        if (!entry) {
            return null
        }

        if (entry.expiresAt <= Date.now()) {
            this.cache.delete(prefixedKey)
            return null
        }

        return entry.value as T
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        this.enforceMaxEntries()
        
        const prefixedKey = this.prefixKey(key)
        const expiresAt = Date.now() + (ttl || this.config.defaultTTL) * 1000

        this.cache.set(prefixedKey, { value, expiresAt })
    }

    async delete(key: string): Promise<boolean> {
        const prefixedKey = this.prefixKey(key)
        return this.cache.delete(prefixedKey)
    }

    async exists(key: string): Promise<boolean> {
        const value = await this.get(key)
        return value !== null
    }

    async clear(): Promise<void> {
        this.cache.clear()
    }

    // Get multiple keys
    async mget<T>(...keys: string[]): Promise<(T | null)[]> {
        return Promise.all(keys.map(key => this.get<T>(key)))
    }

    // Set multiple keys
    async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
        await Promise.all(entries.map(e => this.set(e.key, e.value, e.ttl)))
    }

    // Get stats
    getStats(): { size: number; maxEntries: number } {
        return {
            size: this.cache.size,
            maxEntries: this.config.maxEntries
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval)
        this.cache.clear()
    }
}

// Cache interface for both memory and Redis
interface ICacheService {
    get<T>(key: string): Promise<T | null>
    set<T>(key: string, value: T, ttl?: number): Promise<void>
    delete(key: string): Promise<boolean>
    exists(key: string): Promise<boolean>
    clear(): Promise<void>
}

// Cache service with memory fallback
class CacheService implements ICacheService {
    private memoryCache: MemoryCache
    private redisClient: any = null

    constructor(config?: Partial<CacheConfig>) {
        this.memoryCache = new MemoryCache(config)
        this.initRedis()
    }

    private async initRedis(): Promise<void> {
        const redisUrl = process.env.REDIS_URL

        if (!redisUrl) {
            logger.info('Redis not configured, using in-memory cache')
            return
        }

        try {
            // Dynamic import to avoid errors if ioredis not installed
            const { default: Redis } = await import('ioredis')
            this.redisClient = new Redis(redisUrl)
            
            this.redisClient.on('connect', () => {
                logger.info('Redis connected successfully')
            })

            this.redisClient.on('error', (err: Error) => {
                logger.error('Redis connection error', { error: err.message })
                this.redisClient = null
            })
        } catch (err) {
            logger.warn('Redis client not available, using in-memory cache', {
                error: err instanceof Error ? err.message : 'Unknown error'
            })
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (this.redisClient) {
            try {
                const value = await this.redisClient.get(key)
                return value ? JSON.parse(value) : null
            } catch (err) {
                logger.warn('Redis get failed, falling back to memory', { key })
            }
        }
        return this.memoryCache.get<T>(key)
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        if (this.redisClient) {
            try {
                const serialized = JSON.stringify(value)
                if (ttl) {
                    await this.redisClient.setex(key, ttl, serialized)
                } else {
                    await this.redisClient.set(key, serialized)
                }
                return
            } catch (err) {
                logger.warn('Redis set failed, falling back to memory', { key })
            }
        }
        await this.memoryCache.set(key, value, ttl)
    }

    async delete(key: string): Promise<boolean> {
        if (this.redisClient) {
            try {
                const result = await this.redisClient.del(key)
                return result > 0
            } catch (err) {
                logger.warn('Redis delete failed, falling back to memory', { key })
            }
        }
        return this.memoryCache.delete(key)
    }

    async exists(key: string): Promise<boolean> {
        if (this.redisClient) {
            try {
                const result = await this.redisClient.exists(key)
                return result > 0
            } catch (err) {
                logger.warn('Redis exists failed, falling back to memory', { key })
            }
        }
        return this.memoryCache.exists(key)
    }

    async clear(): Promise<void> {
        if (this.redisClient) {
            try {
                await this.redisClient.flushdb()
            } catch (err) {
                logger.warn('Redis clear failed')
            }
        }
        await this.memoryCache.clear()
    }

    // Helper for caching function results
    async getOrSet<T>(
        key: string, 
        factory: () => Promise<T>, 
        ttl?: number
    ): Promise<T> {
        const cached = await this.get<T>(key)
        if (cached !== null) {
            return cached
        }

        const value = await factory()
        await this.set(key, value, ttl)
        return value
    }

    // Cache decorator for LLM responses
    async cacheLLMResponse<T>(
        prompt: string,
        model: string,
        factory: () => Promise<T>,
        ttl: number = 3600
    ): Promise<T> {
        const { createHash } = await import('crypto')
        const hash = createHash('sha256').update(`${model}:${prompt}`).digest('hex')
        const key = `llm:${hash}`

        return this.getOrSet(key, factory, ttl)
    }

    getStats(): any {
        return {
            type: this.redisClient ? 'redis' : 'memory',
            memory: this.memoryCache.getStats()
        }
    }
}

// Export singleton instance
export const cache = new CacheService()

// Export class for custom instances
export { CacheService, MemoryCache }
export type { CacheConfig, ICacheService }

