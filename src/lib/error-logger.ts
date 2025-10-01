// Error logging utility for development and debugging

interface ErrorLog {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  context: string
  message: string
  details?: any
  userAgent?: string
  url?: string
}

class ErrorLogger {
  private static instance: ErrorLogger
  private logs: ErrorLog[] = []
  private maxLogs = 100

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  private constructor() {
    // Listen for unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError('global', event.message, {
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.logError('promise', 'Unhandled Promise Rejection', {
          reason: event.reason,
          stack: event.reason?.stack
        })
      })
    }
  }

  public logError(context: string, message: string, details?: any): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      context,
      message,
      details,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    this.addLog(log)
    console.error(`[${context}] ${message}`, details)
  }

  public logWarning(context: string, message: string, details?: any): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      context,
      message,
      details,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    this.addLog(log)
    console.warn(`[${context}] ${message}`, details)
  }

  public logInfo(context: string, message: string, details?: any): void {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      context,
      message,
      details,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    this.addLog(log)
    console.info(`[${context}] ${message}`, details)
  }

  private addLog(log: ErrorLog): void {
    this.logs.unshift(log)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Store in localStorage for persistence during the session
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('adronaut_error_logs', JSON.stringify(this.logs))
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  public getLogs(): ErrorLog[] {
    return [...this.logs]
  }

  public getRecentErrors(limit = 10): ErrorLog[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(0, limit)
  }

  public clearLogs(): void {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adronaut_error_logs')
    }
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Load logs from localStorage on initialization
  public loadStoredLogs(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adronaut_error_logs')
        if (stored) {
          this.logs = JSON.parse(stored)
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
}

export const errorLogger = ErrorLogger.getInstance()

// Initialize stored logs
if (typeof window !== 'undefined') {
  errorLogger.loadStoredLogs()
}