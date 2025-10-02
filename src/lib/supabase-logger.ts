/**
 * Supabase wrapper with comprehensive logging
 * Logs all database operations, queries, and performance metrics
 */

import { supabase } from './supabase'
import { logger } from './logger'

interface QueryOptions {
  table: string
  operation: string
  filters?: Record<string, any>
  select?: string
  orderBy?: string
  limit?: number
}

class SupabaseLogger {
  private static instance: SupabaseLogger

  public static getInstance(): SupabaseLogger {
    if (!SupabaseLogger.instance) {
      SupabaseLogger.instance = new SupabaseLogger()
    }
    return SupabaseLogger.instance
  }

  // Wrapper for SELECT operations
  async select(table: string, config: {
    select?: string
    eq?: Record<string, any>
    in?: Record<string, any[]>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    offset?: number
  } = {}) {
    const timer = logger.startTimer(`SUPABASE_SELECT_${table.toUpperCase()}`)

    try {
      logger.debug(`Starting Supabase SELECT on ${table}`, {
        table,
        select: config.select || '*',
        filters: { ...config.eq, ...config.in },
        orderBy: config.orderBy,
        limit: config.limit
      })

      let query = supabase.from(table).select(config.select || '*')

      // Apply filters
      if (config.eq) {
        Object.entries(config.eq).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (config.in) {
        Object.entries(config.in).forEach(([key, values]) => {
          query = query.in(key, values)
        })
      }

      // Apply ordering
      if (config.orderBy) {
        query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true })
      }

      // Apply pagination
      if (config.limit) {
        query = query.limit(config.limit)
      }

      if (config.offset) {
        query = query.range(config.offset, config.offset + (config.limit || 100) - 1)
      }

      const result = await query

      const duration = logger.endTimer(timer)

      logger.supabaseQuery('SELECT', table, {
        select: config.select || '*',
        filters: { ...config.eq, ...config.in },
        orderBy: config.orderBy,
        limit: config.limit
      }, result, duration)

      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.supabaseQuery('SELECT', table, config, null, duration, error)
      throw error
    }
  }

  // Wrapper for INSERT operations
  async insert(table: string, data: any | any[], config: {
    select?: string
    onConflict?: string
  } = {}) {
    const timer = logger.startTimer(`SUPABASE_INSERT_${table.toUpperCase()}`)

    try {
      const recordCount = Array.isArray(data) ? data.length : 1

      logger.debug(`Starting Supabase INSERT on ${table}`, {
        table,
        recordCount,
        hasData: !!data,
        onConflict: config.onConflict
      })

      let query = supabase.from(table).insert(data)

      if (config.select) {
        query = query.select(config.select)
      }

      if (config.onConflict) {
        query = query.onConflict(config.onConflict)
      }

      const result = await query

      const duration = logger.endTimer(timer)

      logger.supabaseQuery('INSERT', table, {
        recordCount,
        select: config.select,
        onConflict: config.onConflict
      }, result, duration)

      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.supabaseQuery('INSERT', table, { data: Array.isArray(data) ? `${data.length} records` : 'single record' }, null, duration, error)
      throw error
    }
  }

  // Wrapper for UPDATE operations
  async update(table: string, data: any, config: {
    eq?: Record<string, any>
    select?: string
  }) {
    const timer = logger.startTimer(`SUPABASE_UPDATE_${table.toUpperCase()}`)

    try {
      logger.debug(`Starting Supabase UPDATE on ${table}`, {
        table,
        hasData: !!data,
        filters: config.eq
      })

      let query = supabase.from(table).update(data)

      // Apply filters
      if (config.eq) {
        Object.entries(config.eq).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (config.select) {
        query = query.select(config.select)
      }

      const result = await query

      const duration = logger.endTimer(timer)

      logger.supabaseQuery('UPDATE', table, {
        filters: config.eq,
        select: config.select
      }, result, duration)

      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.supabaseQuery('UPDATE', table, config, null, duration, error)
      throw error
    }
  }

  // Wrapper for DELETE operations
  async delete(table: string, config: {
    eq?: Record<string, any>
    select?: string
  }) {
    const timer = logger.startTimer(`SUPABASE_DELETE_${table.toUpperCase()}`)

    try {
      logger.debug(`Starting Supabase DELETE on ${table}`, {
        table,
        filters: config.eq
      })

      let query = supabase.from(table).delete()

      // Apply filters
      if (config.eq) {
        Object.entries(config.eq).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (config.select) {
        query = query.select(config.select)
      }

      const result = await query

      const duration = logger.endTimer(timer)

      logger.supabaseQuery('DELETE', table, {
        filters: config.eq,
        select: config.select
      }, result, duration)

      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.supabaseQuery('DELETE', table, config, null, duration, error)
      throw error
    }
  }

  // Wrapper for UPSERT operations
  async upsert(table: string, data: any | any[], config: {
    onConflict?: string
    select?: string
    ignoreDuplicates?: boolean
  } = {}) {
    const timer = logger.startTimer(`SUPABASE_UPSERT_${table.toUpperCase()}`)

    try {
      const recordCount = Array.isArray(data) ? data.length : 1

      logger.debug(`Starting Supabase UPSERT on ${table}`, {
        table,
        recordCount,
        onConflict: config.onConflict,
        ignoreDuplicates: config.ignoreDuplicates
      })

      let query = supabase.from(table).upsert(data, {
        onConflict: config.onConflict,
        ignoreDuplicates: config.ignoreDuplicates
      })

      if (config.select) {
        query = query.select(config.select)
      }

      const result = await query

      const duration = logger.endTimer(timer)

      logger.supabaseQuery('UPSERT', table, {
        recordCount,
        onConflict: config.onConflict,
        select: config.select
      }, result, duration)

      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.supabaseQuery('UPSERT', table, { recordCount: Array.isArray(data) ? data.length : 1 }, null, duration, error)
      throw error
    }
  }

  // Wrapper for RPC (stored procedure) calls
  async rpc(functionName: string, params: Record<string, any> = {}) {
    const timer = logger.startTimer(`SUPABASE_RPC_${functionName.toUpperCase()}`)

    try {
      logger.debug(`Starting Supabase RPC call: ${functionName}`, {
        functionName,
        paramKeys: Object.keys(params),
        paramCount: Object.keys(params).length
      })

      const result = await supabase.rpc(functionName, params)

      const duration = logger.endTimer(timer)

      logger.supabaseQuery('RPC', functionName, {
        paramKeys: Object.keys(params)
      }, result, duration)

      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.supabaseQuery('RPC', functionName, { params: Object.keys(params) }, null, duration, error)
      throw error
    }
  }

  // Wrapper for Storage operations
  async uploadFile(bucket: string, path: string, file: File | Blob, options: {
    cacheControl?: string
    contentType?: string
    upsert?: boolean
  } = {}) {
    const timer = logger.startTimer(`SUPABASE_STORAGE_UPLOAD`)

    try {
      logger.debug(`Starting Supabase Storage upload`, {
        bucket,
        path,
        fileSize: file.size,
        contentType: options.contentType || 'unknown',
        upsert: options.upsert
      })

      const result = await supabase.storage
        .from(bucket)
        .upload(path, file, options)

      const duration = logger.endTimer(timer)

      logger.supabaseQuery('STORAGE_UPLOAD', bucket, {
        path,
        fileSize: file.size,
        contentType: options.contentType
      }, result, duration)

      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.supabaseQuery('STORAGE_UPLOAD', bucket, { path, fileSize: file.size }, null, duration, error)
      throw error
    }
  }

  // Wrapper for Storage download
  async downloadFile(bucket: string, path: string) {
    const timer = logger.startTimer(`SUPABASE_STORAGE_DOWNLOAD`)

    try {
      logger.debug(`Starting Supabase Storage download`, {
        bucket,
        path
      })

      const result = await supabase.storage
        .from(bucket)
        .download(path)

      const duration = logger.endTimer(timer)

      logger.supabaseQuery('STORAGE_DOWNLOAD', bucket, { path }, result, duration)

      return result
    } catch (error) {
      const duration = logger.endTimer(timer)
      logger.supabaseQuery('STORAGE_DOWNLOAD', bucket, { path }, null, duration, error)
      throw error
    }
  }

  // Get direct access to supabase client for complex operations
  get client() {
    logger.debug('Direct Supabase client access requested')
    return supabase
  }
}

// Export singleton instance
export const supabaseLogger = SupabaseLogger.getInstance()

// Export types for use in other files
export type { QueryOptions }