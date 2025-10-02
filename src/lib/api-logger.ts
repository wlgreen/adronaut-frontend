/**
 * API logging middleware for Next.js API routes
 * Provides comprehensive logging for all API requests and responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

export interface ApiLoggerOptions {
  logRequestBody?: boolean
  logResponseBody?: boolean
  logHeaders?: boolean
  maxBodySize?: number
}

const defaultOptions: ApiLoggerOptions = {
  logRequestBody: true,
  logResponseBody: true,
  logHeaders: false,
  maxBodySize: 1024 * 10 // 10KB max body logging
}

export function withApiLogger<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse,
  options: ApiLoggerOptions = {}
) {
  const config = { ...defaultOptions, ...options }

  return async (...args: T): Promise<NextResponse> => {
    const timer = logger.startTimer('API_REQUEST')
    let request = args[0] as NextRequest
    const requestId = generateRequestId()

    try {
      // Log incoming request
      const url = new URL(request.url)
      const method = request.method
      const path = url.pathname

      logger.info(`API ${method} ${path} - Request started`, {
        requestId,
        method,
        path,
        query: Object.fromEntries(url.searchParams.entries()),
        userAgent: request.headers.get('user-agent'),
        ...(config.logHeaders && {
          headers: Object.fromEntries(
            Array.from(request.headers.entries()).filter(([key]) =>
              !key.toLowerCase().includes('authorization') &&
              !key.toLowerCase().includes('cookie')
            )
          )
        })
      })

      // Log request body if applicable
      let requestBody: any = null
      if (config.logRequestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        try {
          const bodyText = await request.text()
          if (bodyText && bodyText.length <= config.maxBodySize!) {
            try {
              requestBody = JSON.parse(bodyText)
              logger.debug(`API ${method} ${path} - Request body`, {
                requestId,
                body: requestBody
              })
            } catch {
              logger.debug(`API ${method} ${path} - Request body (text)`, {
                requestId,
                body: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '')
              })
            }
          } else if (bodyText.length > config.maxBodySize!) {
            logger.debug(`API ${method} ${path} - Request body (large)`, {
              requestId,
              bodySize: bodyText.length,
              bodySample: bodyText.substring(0, 100) + '...'
            })
          }

          // Recreate request with body for handler
          request = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: bodyText || undefined
          }) as NextRequest

          // Update the args array with the new request
          args[0] = request as T[0]
        } catch (error) {
          logger.warn(`Failed to read request body for ${method} ${path}`, {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      // Call the actual handler
      const response = await handler(...args)
      const duration = logger.endTimer(timer)

      // Log response
      logger.apiRequest(method, path, requestBody, {
        status: response.status,
        headers: config.logHeaders ? Object.fromEntries(response.headers.entries()) : undefined
      }, duration)

      // Log response body if applicable
      if (config.logResponseBody && response.body) {
        try {
          const responseClone = response.clone()
          const responseText = await responseClone.text()

          if (responseText && responseText.length <= config.maxBodySize!) {
            try {
              const responseBody = JSON.parse(responseText)
              logger.debug(`API ${method} ${path} - Response body`, {
                requestId,
                status: response.status,
                body: responseBody
              })
            } catch {
              logger.debug(`API ${method} ${path} - Response body (text)`, {
                requestId,
                status: response.status,
                body: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
              })
            }
          } else if (responseText.length > config.maxBodySize!) {
            logger.debug(`API ${method} ${path} - Response body (large)`, {
              requestId,
              status: response.status,
              bodySize: responseText.length,
              bodySample: responseText.substring(0, 100) + '...'
            })
          }
        } catch (error) {
          logger.warn(`Failed to read response body for ${method} ${path}`, {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      logger.info(`API ${method} ${path} - Request completed`, {
        requestId,
        status: response.status,
        duration
      })

      return response

    } catch (error) {
      const duration = logger.endTimer(timer)

      logger.apiRequest(request.method, new URL(request.url).pathname, null, null, duration, error)

      logger.error(`API ${request.method} ${new URL(request.url).pathname} - Request failed`, {
        requestId,
        duration,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack?.substring(0, 500)
        } : error
      })

      // Re-throw the error so it can be handled by the caller
      throw error
    }
  }
}

// Simple wrapper for non-async handlers
export function withApiLoggerSync<T extends any[]>(
  handler: (...args: T) => NextResponse,
  options: ApiLoggerOptions = {}
) {
  return withApiLogger(async (...args: T) => handler(...args), options)
}

// Helper function to generate unique request IDs
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Express-style middleware for legacy compatibility
export function apiLoggerMiddleware(options: ApiLoggerOptions = {}) {
  const config = { ...defaultOptions, ...options }

  return (req: any, res: any, next: any) => {
    const timer = logger.startTimer('API_REQUEST')
    const requestId = generateRequestId()

    // Log incoming request
    logger.info(`API ${req.method} ${req.url} - Request started`, {
      requestId,
      method: req.method,
      path: req.url,
      query: req.query,
      ...(config.logHeaders && {
        headers: Object.fromEntries(
          Object.entries(req.headers).filter(([key]) =>
            !key.toLowerCase().includes('authorization') &&
            !key.toLowerCase().includes('cookie')
          )
        )
      })
    })

    // Log request body if applicable
    if (config.logRequestBody && req.body) {
      const bodyStr = JSON.stringify(req.body)
      if (bodyStr.length <= config.maxBodySize!) {
        logger.debug(`API ${req.method} ${req.url} - Request body`, {
          requestId,
          body: req.body
        })
      } else {
        logger.debug(`API ${req.method} ${req.url} - Request body (large)`, {
          requestId,
          bodySize: bodyStr.length,
          bodySample: bodyStr.substring(0, 100) + '...'
        })
      }
    }

    // Override res.json to log response
    const originalJson = res.json
    res.json = function(body: any) {
      const duration = logger.endTimer(timer)

      logger.apiRequest(req.method, req.url, req.body, {
        status: res.statusCode,
        body: config.logResponseBody ? body : undefined
      }, duration)

      logger.info(`API ${req.method} ${req.url} - Request completed`, {
        requestId,
        status: res.statusCode,
        duration
      })

      return originalJson.call(this, body)
    }

    // Override res.send to log response
    const originalSend = res.send
    res.send = function(body: any) {
      const duration = logger.endTimer(timer)

      logger.apiRequest(req.method, req.url, req.body, {
        status: res.statusCode,
        body: config.logResponseBody ? body : undefined
      }, duration)

      logger.info(`API ${req.method} ${req.url} - Request completed`, {
        requestId,
        status: res.statusCode,
        duration
      })

      return originalSend.call(this, body)
    }

    next()
  }
}