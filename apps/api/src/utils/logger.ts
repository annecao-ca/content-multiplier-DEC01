/**
 * Professional Logger Utility
 * Replaces console.log with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
    [key: string]: any
}

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    context?: LogContext
    requestId?: string
    userId?: string
    service: string
}

class Logger {
    private service: string
    private isDevelopment: boolean
    private minLevel: LogLevel

    private levelPriority: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    }

    constructor(service: string = 'content-multiplier-api') {
        this.service = service
        this.isDevelopment = process.env.NODE_ENV !== 'production'
        this.minLevel = (process.env.LOG_LEVEL as LogLevel) || (this.isDevelopment ? 'debug' : 'info')
    }

    private shouldLog(level: LogLevel): boolean {
        return this.levelPriority[level] >= this.levelPriority[this.minLevel]
    }

    private formatMessage(entry: LogEntry): string {
        if (this.isDevelopment) {
            // Human-readable format for development
            const emoji = {
                debug: '🔍',
                info: '✅',
                warn: '⚠️',
                error: '❌'
            }[entry.level]

            let msg = `${emoji} [${entry.timestamp}] ${entry.message}`
            if (entry.context && Object.keys(entry.context).length > 0) {
                // Filter out sensitive data
                const safeContext = this.sanitizeContext(entry.context)
                msg += ` | ${JSON.stringify(safeContext)}`
            }
            return msg
        } else {
            // JSON format for production (easy to parse by log aggregators)
            return JSON.stringify(this.sanitizeContext(entry))
        }
    }

    private sanitizeContext(context: any): any {
        if (typeof context !== 'object' || context === null) {
            return context
        }

        const sensitiveKeys = [
            'password', 'token', 'apiKey', 'api_key', 'secret',
            'authorization', 'cookie', 'session', 'credit_card',
            'OPENAI_API_KEY', 'GEMINI_API_KEY', 'DEEPSEEK_API_KEY',
            'DATABASE_URL', 'accessToken', 'refreshToken'
        ]

        const sanitized: any = Array.isArray(context) ? [] : {}

        for (const [key, value] of Object.entries(context)) {
            const lowerKey = key.toLowerCase()
            const isSensitive = sensitiveKeys.some(sk => 
                lowerKey.includes(sk.toLowerCase())
            )

            if (isSensitive) {
                sanitized[key] = '[REDACTED]'
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeContext(value)
            } else {
                sanitized[key] = value
            }
        }

        return sanitized
    }

    private log(level: LogLevel, message: string, context?: LogContext): void {
        if (!this.shouldLog(level)) return

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            service: this.service
        }

        const formatted = this.formatMessage(entry)

        switch (level) {
            case 'debug':
            case 'info':
                console.log(formatted)
                break
            case 'warn':
                console.warn(formatted)
                break
            case 'error':
                console.error(formatted)
                break
        }
    }

    debug(message: string, context?: LogContext): void {
        this.log('debug', message, context)
    }

    info(message: string, context?: LogContext): void {
        this.log('info', message, context)
    }

    warn(message: string, context?: LogContext): void {
        this.log('warn', message, context)
    }

    error(message: string, context?: LogContext): void {
        this.log('error', message, context)
    }

    // Create child logger with additional context
    child(defaultContext: LogContext): ChildLogger {
        return new ChildLogger(this, defaultContext)
    }

    // Log HTTP request
    request(req: any, res: any, duration: number): void {
        const level: LogLevel = res.statusCode >= 500 ? 'error' : 
                                res.statusCode >= 400 ? 'warn' : 'info'

        this.log(level, `${req.method} ${req.url}`, {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userAgent: req.headers['user-agent'],
            ip: req.ip
        })
    }

    // Log database query
    query(sql: string, duration: number, error?: Error): void {
        const truncatedSql = sql.length > 100 ? sql.substring(0, 100) + '...' : sql

        if (error) {
            this.error('Database query failed', {
                sql: truncatedSql,
                duration: `${duration}ms`,
                error: error.message
            })
        } else {
            this.debug('Database query executed', {
                sql: truncatedSql,
                duration: `${duration}ms`
            })
        }
    }

    // Log external API call
    externalApi(service: string, endpoint: string, duration: number, status: number, error?: Error): void {
        const level: LogLevel = error ? 'error' : status >= 400 ? 'warn' : 'debug'

        this.log(level, `External API call: ${service}`, {
            service,
            endpoint,
            status,
            duration: `${duration}ms`,
            error: error?.message
        })
    }
}

class ChildLogger {
    private parent: Logger
    private defaultContext: LogContext

    constructor(parent: Logger, defaultContext: LogContext) {
        this.parent = parent
        this.defaultContext = defaultContext
    }

    private mergeContext(context?: LogContext): LogContext {
        return { ...this.defaultContext, ...context }
    }

    debug(message: string, context?: LogContext): void {
        this.parent.debug(message, this.mergeContext(context))
    }

    info(message: string, context?: LogContext): void {
        this.parent.info(message, this.mergeContext(context))
    }

    warn(message: string, context?: LogContext): void {
        this.parent.warn(message, this.mergeContext(context))
    }

    error(message: string, context?: LogContext): void {
        this.parent.error(message, this.mergeContext(context))
    }
}

// Export singleton instance
export const logger = new Logger()

// Export class for custom instances
export { Logger, ChildLogger }
export type { LogLevel, LogContext, LogEntry }

