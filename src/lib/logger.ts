/**
 * Centralized logging utility for Adronaut backend operations
 * Provides structured logging for LLM calls, Supabase operations, and API requests
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogContext {
  operation?: string
  duration?: number
  requestId?: string
  userId?: string
  projectId?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel = process.env.LOG_LEVEL || 'INFO'

  private shouldLog(level: LogLevel): boolean {
    const levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 }
    return levels[level] >= levels[this.logLevel as LogLevel]
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}]`

    if (context) {
      const sanitizedContext = this.sanitizeContext(context)
      return `${prefix} ${message}\n${JSON.stringify(sanitizedContext, null, 2)}`
    }

    return `${prefix} ${message}`
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context }

    // Remove sensitive data
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth']
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase()
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      }
    })

    // Redact user personal data but keep IDs
    if (sanitized.user) {
      if (typeof sanitized.user === 'object') {
        sanitized.user = {
          id: sanitized.user.id,
          // Remove any other user fields
          '[other_fields]': '[REDACTED]'
        }
      }
    }

    return sanitized
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('DEBUG') && this.isDevelopment) {
      console.log(this.formatLog('DEBUG', message, context))
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('INFO')) {
      console.log(this.formatLog('INFO', message, context))
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatLog('WARN', message, context))
    }
  }

  error(message: string, context?: LogContext) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatLog('ERROR', message, context))
    }
  }

  // Specialized logging methods for different operations

  llmCall(operation: string, request: any, response?: any, duration?: number, error?: any) {
    const context: LogContext = {
      operation: `LLM_${operation}`,
      duration,
      request: {
        model: request.model,
        messages: request.messages?.map((msg: any) => ({
          role: msg.role,
          content: typeof msg.content === 'string'
            ? msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : '')
            : '[COMPLEX_CONTENT]'
        })),
        temperature: request.temperature,
        max_tokens: request.max_tokens
      }
    }

    if (response) {
      context.response = {
        choices: response.choices?.map((choice: any) => ({
          role: choice.message?.role,
          content: typeof choice.message?.content === 'string'
            ? choice.message.content.substring(0, 500) + (choice.message.content.length > 500 ? '...' : '')
            : '[COMPLEX_CONTENT]'
        })),
        usage: response.usage,
        model: response.model
      }
    }

    if (error) {
      context.error = {
        message: error.message,
        type: error.constructor.name,
        status: error.status || error.code
      }
      this.error(`LLM ${operation} failed`, context)
    } else {
      this.info(`LLM ${operation} completed`, context)
    }
  }

  supabaseQuery(operation: string, table: string, query: any, result?: any, duration?: number, error?: any) {
    const context: LogContext = {
      operation: `SUPABASE_${operation}`,
      table,
      duration,
      query: {
        method: operation,
        filters: query.filters || 'none',
        select: query.select || '*',
        limit: query.limit,
        orderBy: query.orderBy
      }
    }

    if (result && result.data) {
      context.result = {
        count: Array.isArray(result.data) ? result.data.length : 1,
        hasError: !!result.error,
        status: result.status
      }
    }

    if (error || (result && result.error)) {
      const err = error || result.error
      context.error = {
        message: err.message,
        code: err.code,
        details: err.details
      }
      this.error(`Supabase ${operation} on ${table} failed`, context)
    } else {
      this.info(`Supabase ${operation} on ${table} completed`, context)
    }
  }

  apiRequest(method: string, url: string, requestBody?: any, response?: any, duration?: number, error?: any) {
    const context: LogContext = {
      operation: `API_${method}`,
      url: url.replace(/\/api\/projects\/[^\/]+/, '/api/projects/[id]'), // Sanitize project IDs
      duration,
      method
    }

    if (requestBody) {
      context.requestBody = typeof requestBody === 'object'
        ? Object.keys(requestBody).reduce((acc, key) => {
            if (key.toLowerCase().includes('data') && typeof requestBody[key] === 'string' && requestBody[key].length > 100) {
              acc[key] = `[LARGE_DATA:${requestBody[key].length}chars]`
            } else {
              acc[key] = requestBody[key]
            }
            return acc
          }, {} as any)
        : '[NON_OBJECT_BODY]'
    }

    if (response) {
      context.response = {
        status: response.status || 'unknown',
        hasData: !!response.data || !!response.body,
        dataSize: response.data ? JSON.stringify(response.data).length : 0
      }
    }

    if (error) {
      context.error = {
        message: error.message,
        status: error.status || error.code,
        type: error.constructor.name
      }
      this.error(`API ${method} ${url} failed`, context)
    } else {
      this.info(`API ${method} ${url} completed`, context)
    }
  }

  // Performance timing helpers
  startTimer(operation: string): { operation: string; startTime: number } {
    const timer = { operation, startTime: Date.now() }
    this.debug(`Starting ${operation}`)
    return timer
  }

  endTimer(timer: { operation: string; startTime: number }): number {
    const duration = Date.now() - timer.startTime
    this.debug(`Completed ${timer.operation}`, { duration })
    return duration
  }
}

// Export singleton instance
export const logger = new Logger()

// Export types for use in other files
export type { LogContext, LogLevel }