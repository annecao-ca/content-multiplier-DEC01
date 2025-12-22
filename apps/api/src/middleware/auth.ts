/**
 * JWT Authentication Middleware
 * Provides secure authentication for API routes
 */

import { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import crypto from 'crypto'
import { logger } from '../utils/logger.ts'

// Types
export interface User {
    id: string
    email: string
    name: string
    role: UserRole
    createdAt: Date
}

export type UserRole = 'admin' | 'editor' | 'viewer' | 'api'

export interface JWTPayload {
    sub: string          // User ID
    email: string
    name: string
    role: UserRole
    iat: number          // Issued at
    exp: number          // Expiration
}

export interface AuthConfig {
    jwtSecret: string
    jwtExpiresIn: number      // seconds
    refreshExpiresIn: number  // seconds
}

// Extend Fastify types
declare module 'fastify' {
    interface FastifyRequest {
        user?: JWTPayload
        isAuthenticated: boolean
    }
}

// Simple JWT implementation (no external dependencies)
class SimpleJWT {
    private secret: string

    constructor(secret: string) {
        this.secret = secret
    }

    private base64UrlEncode(data: string): string {
        return Buffer.from(data)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
    }

    private base64UrlDecode(data: string): string {
        const padded = data + '='.repeat((4 - data.length % 4) % 4)
        return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    }

    private createSignature(header: string, payload: string): string {
        const hmac = crypto.createHmac('sha256', this.secret)
        hmac.update(`${header}.${payload}`)
        return this.base64UrlEncode(hmac.digest('base64'))
    }

    sign(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number): string {
        const header = this.base64UrlEncode(JSON.stringify({
            alg: 'HS256',
            typ: 'JWT'
        }))

        const now = Math.floor(Date.now() / 1000)
        const fullPayload: JWTPayload = {
            ...payload,
            iat: now,
            exp: now + expiresIn
        }

        const payloadB64 = this.base64UrlEncode(JSON.stringify(fullPayload))
        const signature = this.createSignature(header, payloadB64)

        return `${header}.${payloadB64}.${signature}`
    }

    verify(token: string): JWTPayload | null {
        try {
            const parts = token.split('.')
            if (parts.length !== 3) {
                return null
            }

            const [header, payload, signature] = parts
            const expectedSignature = this.createSignature(header, payload)

            // Timing-safe comparison
            if (!crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            )) {
                return null
            }

            const decoded = JSON.parse(this.base64UrlDecode(payload)) as JWTPayload

            // Check expiration
            if (decoded.exp < Math.floor(Date.now() / 1000)) {
                return null
            }

            return decoded
        } catch {
            return null
        }
    }
}

// Auth service
export class AuthService {
    private jwt: SimpleJWT
    private config: AuthConfig

    constructor(config?: Partial<AuthConfig>) {
        this.config = {
            jwtSecret: process.env.JWT_SECRET || this.generateDefaultSecret(),
            jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600'), // 1 hour
            refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800'), // 7 days
            ...config
        }

        if (!process.env.JWT_SECRET) {
            logger.warn('JWT_SECRET not set, using auto-generated secret. Set JWT_SECRET in production!')
        }

        this.jwt = new SimpleJWT(this.config.jwtSecret)
    }

    private generateDefaultSecret(): string {
        return crypto.randomBytes(32).toString('hex')
    }

    // Generate access token
    generateAccessToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>): string {
        return this.jwt.sign(
            {
                sub: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            this.config.jwtExpiresIn
        )
    }

    // Generate refresh token
    generateRefreshToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'>): string {
        return this.jwt.sign(
            {
                sub: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            this.config.refreshExpiresIn
        )
    }

    // Verify token
    verifyToken(token: string): JWTPayload | null {
        return this.jwt.verify(token)
    }

    // Hash password
    async hashPassword(password: string): Promise<string> {
        const salt = crypto.randomBytes(16).toString('hex')
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
        return `${salt}:${hash}`
    }

    // Verify password
    async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        const [salt, hash] = hashedPassword.split(':')
        const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash))
    }
}

// Singleton instance
export const authService = new AuthService()

// Authentication middleware plugin
const authPlugin: FastifyPluginAsync = async (app) => {
    // Add authentication hook
    app.decorateRequest('user', undefined)
    app.decorateRequest('isAuthenticated', false)

    app.addHook('onRequest', async (request: FastifyRequest) => {
        request.isAuthenticated = false

        // Get token from Authorization header
        const authHeader = request.headers.authorization
        if (!authHeader?.startsWith('Bearer ')) {
            // Fallback to legacy headers for backward compatibility
            const legacyUserId = request.headers['x-user-id'] as string
            const legacyRole = request.headers['x-user-role'] as string

            if (legacyUserId) {
                // Create mock user from legacy headers (deprecation mode)
                request.user = {
                    sub: legacyUserId,
                    email: `${legacyUserId}@legacy.local`,
                    name: legacyUserId,
                    role: (legacyRole as UserRole) || 'viewer',
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + 3600
                }
                request.isAuthenticated = true
                
                // Log deprecation warning (only once per request type)
                logger.warn('Legacy auth headers used - please migrate to JWT', {
                    userId: legacyUserId,
                    path: request.url
                })
            }
            return
        }

        const token = authHeader.substring(7)
        const payload = authService.verifyToken(token)

        if (payload) {
            request.user = payload
            request.isAuthenticated = true
        }
    })
}

export default fp(authPlugin, {
    name: 'auth-plugin'
})

// Middleware to require authentication
export function requireAuth(request: FastifyRequest, reply: FastifyReply): void {
    if (!request.isAuthenticated) {
        reply.status(401).send({
            ok: false,
            error: 'unauthorized',
            message: 'Authentication required. Please provide a valid Bearer token.'
        })
        throw new Error('Unauthorized')
    }
}

// Middleware to require specific roles (RBAC)
export function requireRole(...allowedRoles: UserRole[]) {
    return (request: FastifyRequest, reply: FastifyReply): void => {
        if (!request.isAuthenticated) {
            reply.status(401).send({
                ok: false,
                error: 'unauthorized',
                message: 'Authentication required.'
            })
            throw new Error('Unauthorized')
        }

        if (!request.user || !allowedRoles.includes(request.user.role)) {
            reply.status(403).send({
                ok: false,
                error: 'forbidden',
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
            })
            throw new Error('Forbidden')
        }
    }
}

// Role hierarchy for permission checks
export const roleHierarchy: Record<UserRole, number> = {
    admin: 100,
    editor: 50,
    viewer: 10,
    api: 30
}

// Check if user has minimum role level
export function hasMinRole(userRole: UserRole, minRole: UserRole): boolean {
    return roleHierarchy[userRole] >= roleHierarchy[minRole]
}

