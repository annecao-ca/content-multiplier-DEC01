/**
 * Authentication Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AuthService, hasMinRole, roleHierarchy } from '../../src/middleware/auth'

describe('AuthService', () => {
    let authService: AuthService

    beforeEach(() => {
        authService = new AuthService({
            jwtSecret: 'test-secret-key-for-testing-only'
        })
    })

    describe('generateAccessToken', () => {
        it('should generate a valid JWT token', () => {
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'editor' as const
            }

            const token = authService.generateAccessToken(user)
            
            expect(token).toBeDefined()
            expect(typeof token).toBe('string')
            expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
        })
    })

    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'editor' as const
            }

            const token = authService.generateAccessToken(user)
            const payload = authService.verifyToken(token)

            expect(payload).not.toBeNull()
            expect(payload?.sub).toBe(user.id)
            expect(payload?.email).toBe(user.email)
            expect(payload?.role).toBe(user.role)
        })

        it('should return null for invalid token', () => {
            const payload = authService.verifyToken('invalid-token')
            expect(payload).toBeNull()
        })

        it('should return null for tampered token', () => {
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
                role: 'editor' as const
            }

            const token = authService.generateAccessToken(user)
            const tamperedToken = token.slice(0, -5) + 'xxxxx'
            
            const payload = authService.verifyToken(tamperedToken)
            expect(payload).toBeNull()
        })
    })

    describe('password hashing', () => {
        it('should hash password correctly', async () => {
            const password = 'test-password-123'
            const hash = await authService.hashPassword(password)

            expect(hash).toBeDefined()
            expect(hash).toContain(':') // salt:hash format
            expect(hash).not.toBe(password)
        })

        it('should verify correct password', async () => {
            const password = 'test-password-123'
            const hash = await authService.hashPassword(password)

            const isValid = await authService.verifyPassword(password, hash)
            expect(isValid).toBe(true)
        })

        it('should reject incorrect password', async () => {
            const password = 'test-password-123'
            const hash = await authService.hashPassword(password)

            const isValid = await authService.verifyPassword('wrong-password', hash)
            expect(isValid).toBe(false)
        })

        it('should generate different hashes for same password', async () => {
            const password = 'test-password-123'
            const hash1 = await authService.hashPassword(password)
            const hash2 = await authService.hashPassword(password)

            expect(hash1).not.toBe(hash2) // Different salts
        })
    })
})

describe('Role Hierarchy', () => {
    it('should have correct role priorities', () => {
        expect(roleHierarchy.admin).toBeGreaterThan(roleHierarchy.editor)
        expect(roleHierarchy.editor).toBeGreaterThan(roleHierarchy.viewer)
    })

    describe('hasMinRole', () => {
        it('admin should have all roles', () => {
            expect(hasMinRole('admin', 'admin')).toBe(true)
            expect(hasMinRole('admin', 'editor')).toBe(true)
            expect(hasMinRole('admin', 'viewer')).toBe(true)
        })

        it('editor should have editor and viewer roles', () => {
            expect(hasMinRole('editor', 'admin')).toBe(false)
            expect(hasMinRole('editor', 'editor')).toBe(true)
            expect(hasMinRole('editor', 'viewer')).toBe(true)
        })

        it('viewer should only have viewer role', () => {
            expect(hasMinRole('viewer', 'admin')).toBe(false)
            expect(hasMinRole('viewer', 'editor')).toBe(false)
            expect(hasMinRole('viewer', 'viewer')).toBe(true)
        })
    })
})

