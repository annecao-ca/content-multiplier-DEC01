/**
 * Authentication Routes
 * Handles user registration, login, and token management
 */

import { FastifyPluginAsync } from 'fastify'
import { q } from '../db.ts'
import { authService, requireAuth, UserRole } from '../middleware/auth.ts'
import { authRateLimit } from '../middleware/rate-limit.ts'
import { logger } from '../utils/logger.ts'

interface RegisterBody {
    email: string
    password: string
    name: string
}

interface LoginBody {
    email: string
    password: string
}

interface RefreshBody {
    refreshToken: string
}

const routes: FastifyPluginAsync = async (app) => {
    /**
     * POST /api/auth/register
     * Register a new user
     */
    app.post('/register', {
        preHandler: [authRateLimit]
    }, async (request, reply) => {
        const { email, password, name } = request.body as RegisterBody

        // Validation
        if (!email || !password || !name) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'Email, password, and name are required'
            })
        }

        if (password.length < 8) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'Password must be at least 8 characters'
            })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'Invalid email format'
            })
        }

        try {
            // Check if user exists
            const [existing] = await q(
                'SELECT id FROM users WHERE email = $1',
                [email.toLowerCase()]
            )

            if (existing) {
                return reply.status(409).send({
                    ok: false,
                    error: 'user_exists',
                    message: 'A user with this email already exists'
                })
            }

            // Hash password
            const hashedPassword = await authService.hashPassword(password)

            // Create user
            const [user] = await q(
                `INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())
                 RETURNING id, email, name, role, created_at`,
                [email.toLowerCase(), hashedPassword, name, 'viewer']
            )

            // Generate tokens
            const accessToken = authService.generateAccessToken({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            })

            const refreshToken = authService.generateRefreshToken({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            })

            logger.info('User registered', { userId: user.id, email: user.email })

            return {
                ok: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                accessToken,
                refreshToken,
                expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600')
            }
        } catch (error: any) {
            logger.error('Registration failed', { error: error.message, email })
            
            return reply.status(500).send({
                ok: false,
                error: 'registration_failed',
                message: 'Failed to create user account'
            })
        }
    })

    /**
     * POST /api/auth/login
     * Authenticate user and return tokens
     */
    app.post('/login', {
        preHandler: [authRateLimit]
    }, async (request, reply) => {
        const { email, password } = request.body as LoginBody

        if (!email || !password) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'Email and password are required'
            })
        }

        try {
            // Find user
            const [user] = await q(
                'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
                [email.toLowerCase()]
            )

            if (!user) {
                return reply.status(401).send({
                    ok: false,
                    error: 'invalid_credentials',
                    message: 'Invalid email or password'
                })
            }

            // Verify password
            const isValid = await authService.verifyPassword(password, user.password_hash)
            if (!isValid) {
                logger.warn('Failed login attempt', { email })
                return reply.status(401).send({
                    ok: false,
                    error: 'invalid_credentials',
                    message: 'Invalid email or password'
                })
            }

            // Generate tokens
            const accessToken = authService.generateAccessToken({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            })

            const refreshToken = authService.generateRefreshToken({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            })

            // Update last login
            await q('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

            logger.info('User logged in', { userId: user.id })

            return {
                ok: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                accessToken,
                refreshToken,
                expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600')
            }
        } catch (error: any) {
            logger.error('Login failed', { error: error.message, email })
            
            return reply.status(500).send({
                ok: false,
                error: 'login_failed',
                message: 'Failed to authenticate'
            })
        }
    })

    /**
     * POST /api/auth/refresh
     * Refresh access token using refresh token
     */
    app.post('/refresh', async (request, reply) => {
        const { refreshToken } = request.body as RefreshBody

        if (!refreshToken) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'Refresh token is required'
            })
        }

        try {
            const payload = authService.verifyToken(refreshToken)
            if (!payload) {
                return reply.status(401).send({
                    ok: false,
                    error: 'invalid_token',
                    message: 'Invalid or expired refresh token'
                })
            }

            // Verify user still exists
            const [user] = await q(
                'SELECT id, email, name, role FROM users WHERE id = $1',
                [payload.sub]
            )

            if (!user) {
                return reply.status(401).send({
                    ok: false,
                    error: 'user_not_found',
                    message: 'User no longer exists'
                })
            }

            // Generate new access token
            const accessToken = authService.generateAccessToken({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            })

            return {
                ok: true,
                accessToken,
                expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '3600')
            }
        } catch (error: any) {
            logger.error('Token refresh failed', { error: error.message })
            
            return reply.status(500).send({
                ok: false,
                error: 'refresh_failed',
                message: 'Failed to refresh token'
            })
        }
    })

    /**
     * GET /api/auth/me
     * Get current user info
     */
    app.get('/me', {
        preHandler: [(req, reply) => requireAuth(req, reply)]
    }, async (request, reply) => {
        try {
            const userId = request.user!.sub

            const [user] = await q(
                `SELECT id, email, name, role, created_at, last_login 
                 FROM users WHERE id = $1`,
                [userId]
            )

            if (!user) {
                return reply.status(404).send({
                    ok: false,
                    error: 'user_not_found',
                    message: 'User not found'
                })
            }

            return {
                ok: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    createdAt: user.created_at,
                    lastLogin: user.last_login
                }
            }
        } catch (error: any) {
            logger.error('Get user failed', { error: error.message })
            
            return reply.status(500).send({
                ok: false,
                error: 'fetch_failed',
                message: 'Failed to fetch user info'
            })
        }
    })

    /**
     * POST /api/auth/change-password
     * Change user password
     */
    app.post('/change-password', {
        preHandler: [(req, reply) => requireAuth(req, reply)]
    }, async (request, reply) => {
        const { currentPassword, newPassword } = request.body as {
            currentPassword: string
            newPassword: string
        }

        if (!currentPassword || !newPassword) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'Current password and new password are required'
            })
        }

        if (newPassword.length < 8) {
            return reply.status(400).send({
                ok: false,
                error: 'validation_error',
                message: 'New password must be at least 8 characters'
            })
        }

        try {
            const userId = request.user!.sub

            const [user] = await q(
                'SELECT password_hash FROM users WHERE id = $1',
                [userId]
            )

            // Verify current password
            const isValid = await authService.verifyPassword(currentPassword, user.password_hash)
            if (!isValid) {
                return reply.status(401).send({
                    ok: false,
                    error: 'invalid_password',
                    message: 'Current password is incorrect'
                })
            }

            // Hash new password
            const hashedPassword = await authService.hashPassword(newPassword)

            // Update password
            await q(
                'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
                [hashedPassword, userId]
            )

            logger.info('Password changed', { userId })

            return {
                ok: true,
                message: 'Password changed successfully'
            }
        } catch (error: any) {
            logger.error('Password change failed', { error: error.message })
            
            return reply.status(500).send({
                ok: false,
                error: 'change_failed',
                message: 'Failed to change password'
            })
        }
    })
}

export default routes

