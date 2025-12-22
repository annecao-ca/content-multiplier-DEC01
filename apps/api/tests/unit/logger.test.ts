/**
 * Logger Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Logger } from '../../src/utils/logger'

describe('Logger', () => {
    let logger: Logger
    let consoleSpy: {
        log: ReturnType<typeof vi.spyOn>
        warn: ReturnType<typeof vi.spyOn>
        error: ReturnType<typeof vi.spyOn>
    }

    beforeEach(() => {
        logger = new Logger('test-service')
        consoleSpy = {
            log: vi.spyOn(console, 'log').mockImplementation(() => {}),
            warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
            error: vi.spyOn(console, 'error').mockImplementation(() => {})
        }
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('log levels', () => {
        it('should log info messages', () => {
            logger.info('Test message')
            expect(consoleSpy.log).toHaveBeenCalled()
        })

        it('should log warn messages', () => {
            logger.warn('Warning message')
            expect(consoleSpy.warn).toHaveBeenCalled()
        })

        it('should log error messages', () => {
            logger.error('Error message')
            expect(consoleSpy.error).toHaveBeenCalled()
        })

        it('should include context in log', () => {
            logger.info('Test with context', { userId: '123', action: 'test' })
            expect(consoleSpy.log).toHaveBeenCalled()
            const call = consoleSpy.log.mock.calls[0][0]
            expect(call).toContain('Test with context')
        })
    })

    describe('sanitization', () => {
        it('should redact sensitive fields', () => {
            logger.info('Login attempt', { 
                email: 'test@example.com',
                password: 'secret123',
                apiKey: 'sk-12345'
            })
            
            const call = consoleSpy.log.mock.calls[0][0]
            expect(call).not.toContain('secret123')
            expect(call).not.toContain('sk-12345')
            expect(call).toContain('[REDACTED]')
        })

        it('should preserve non-sensitive fields', () => {
            logger.info('User action', { 
                userId: '123',
                action: 'click'
            })
            
            const call = consoleSpy.log.mock.calls[0][0]
            expect(call).toContain('123')
            expect(call).toContain('click')
        })
    })

    describe('child logger', () => {
        it('should include default context', () => {
            const child = logger.child({ requestId: 'req-123' })
            child.info('Child log')
            
            const call = consoleSpy.log.mock.calls[0][0]
            expect(call).toContain('req-123')
        })

        it('should merge additional context', () => {
            const child = logger.child({ requestId: 'req-123' })
            child.info('Child log', { extra: 'data' })
            
            const call = consoleSpy.log.mock.calls[0][0]
            expect(call).toContain('req-123')
            expect(call).toContain('extra')
        })
    })
})

