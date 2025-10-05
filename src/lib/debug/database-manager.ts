/**
 * Supabase Database Manager - Handle test/production modes with snapshots and query logging
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../database.types'
import type { DatabaseSnapshot, DatabaseOperation } from './types'
import { workflowDebugger } from './workflow-debugger'
import { v4 as uuidv4 } from 'uuid'

interface DatabaseConfig {
  mode: 'production' | 'test'
  productionUrl: string
  productionKey: string
  testUrl?: string
  testKey?: string
  logging: boolean
  autoSnapshot: boolean
}

interface QueryInterceptor {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  query: any
  params?: any
  startTime: number
  stepId?: string
}

class DatabaseManager {
  private static instance: DatabaseManager
  private client: SupabaseClient<Database>
  private config: DatabaseConfig
  private snapshots: Map<string, DatabaseSnapshot> = new Map()
  private activeInterceptors: Map<string, QueryInterceptor> = new Map()
  private isTestMode: boolean = false

  constructor(config?: Partial<DatabaseConfig>) {
    this.config = {
      mode: process.env.NEXT_PUBLIC_USE_TEST_DB === 'true' ? 'test' : 'production',
      productionUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      productionKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      testUrl: process.env.NEXT_PUBLIC_TEST_SUPABASE_URL,
      testKey: process.env.NEXT_PUBLIC_TEST_SUPABASE_ANON_KEY,
      logging: process.env.NEXT_PUBLIC_DEBUG_DB === 'true',
      autoSnapshot: true,
      ...config
    }

    this.isTestMode = this.config.mode === 'test'

    // Initialize appropriate client
    if (this.isTestMode && this.config.testUrl && this.config.testKey) {
      this.client = createClient<Database>(this.config.testUrl, this.config.testKey)
      console.log('🧪 Database Manager: Using TEST database')
    } else {
      this.client = createClient<Database>(this.config.productionUrl, this.config.productionKey)
      console.log('🏭 Database Manager: Using PRODUCTION database')
    }

    // Create wrapped client with interceptors
    this.wrapClient()
  }

  static getInstance(config?: Partial<DatabaseConfig>): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config)
    }
    return DatabaseManager.instance
  }

  // Get the wrapped Supabase client
  getClient(): SupabaseClient<Database> {
    return this.client
  }

  // Switch between test and production modes
  async switchMode(mode: 'production' | 'test'): Promise<void> {
    if (mode === this.config.mode) return

    this.config.mode = mode
    this.isTestMode = mode === 'test'

    if (this.isTestMode && this.config.testUrl && this.config.testKey) {
      this.client = createClient<Database>(this.config.testUrl, this.config.testKey)
      console.log('🧪 Switched to TEST database')
    } else {
      this.client = createClient<Database>(this.config.productionUrl, this.config.productionKey)
      console.log('🏭 Switched to PRODUCTION database')
    }

    this.wrapClient()
  }

  // Database snapshot management
  async createSnapshot(name: string, description?: string): Promise<string> {
    const snapshotId = uuidv4()
    const tables = await this.getAllTables()
    const snapshot: DatabaseSnapshot = {
      id: snapshotId,
      name,
      created_at: new Date().toISOString(),
      tables,
      metadata: {
        total_size: this.calculateTotalSize(tables),
        table_count: Object.keys(tables).length,
        row_count: Object.values(tables).reduce((sum, rows) => sum + rows.length, 0),
        description
      }
    }

    this.snapshots.set(snapshotId, snapshot)

    // Save to filesystem for persistence
    if (typeof window === 'undefined') {
      await this.saveSnapshotToFile(snapshot)
    }

    console.log(`📸 Created database snapshot: ${name}`, {
      id: snapshotId,
      tables: snapshot.metadata.table_count,
      rows: snapshot.metadata.row_count
    })

    return snapshotId
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshot = this.snapshots.get(snapshotId) || await this.loadSnapshotFromFile(snapshotId)
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`)
    }

    console.log(`🔄 Restoring snapshot: ${snapshot.name}`)

    // Clear all tables first
    await this.clearAllTables()

    // Restore data table by table
    for (const [tableName, rows] of Object.entries(snapshot.tables)) {
      if (rows.length > 0) {
        await this.client.from(tableName as any).insert(rows)
        console.log(`   ✅ Restored ${tableName}: ${rows.length} rows`)
      }
    }

    console.log(`✅ Snapshot restored successfully: ${snapshot.name}`)
  }

  async listSnapshots(): Promise<DatabaseSnapshot[]> {
    return Array.from(this.snapshots.values())
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    this.snapshots.delete(snapshotId)
    // Also delete from filesystem
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs')
        const path = await import('path')
        const snapshotPath = path.join('.cache', 'snapshots', `${snapshotId}.json`)
        fs.unlinkSync(snapshotPath)
      } catch (error) {
        // Ignore file not found errors
      }
    }
  }

  // Query logging and performance tracking
  private wrapClient(): void {
    if (!this.config.logging && !workflowDebugger.isDebugEnabled()) return

    const originalFrom = this.client.from.bind(this.client)

    this.client.from = (table: any) => {
      const queryBuilder = originalFrom(table)
      return this.wrapQueryBuilder(queryBuilder, table)
    }
  }

  private wrapQueryBuilder(queryBuilder: any, tableName: string): any {
    const methods = ['select', 'insert', 'update', 'delete', 'upsert']

    methods.forEach(method => {
      const original = queryBuilder[method]
      if (typeof original === 'function') {
        queryBuilder[method] = (...args: any[]) => {
          const interceptorId = uuidv4()
          const interceptor: QueryInterceptor = {
            table: tableName,
            operation: method as any,
            query: args,
            startTime: Date.now(),
            stepId: workflowDebugger.getCurrentExecution()?.steps.slice(-1)[0]?.id
          }

          this.activeInterceptors.set(interceptorId, interceptor)

          // Track database operation in workflow debugger
          let dbOpId = ''
          if (workflowDebugger.isDebugEnabled() && interceptor.stepId) {
            dbOpId = workflowDebugger.trackDatabaseOperation(
              interceptor.stepId,
              method,
              tableName,
              JSON.stringify(args),
              undefined
            )
          }

          const result = original.apply(queryBuilder, args)

          // If this returns a promise (for .then() chains), wrap it
          if (result && typeof result.then === 'function') {
            return result
              .then((response: any) => {
                this.completeInterceptor(interceptorId, dbOpId, response, undefined)
                return response
              })
              .catch((error: any) => {
                this.completeInterceptor(interceptorId, dbOpId, undefined, error)
                throw error
              })
          }

          return result
        }
      }
    })

    return queryBuilder
  }

  private completeInterceptor(interceptorId: string, dbOpId: string, response?: any, error?: any): void {
    const interceptor = this.activeInterceptors.get(interceptorId)
    if (!interceptor) return

    const duration = Date.now() - interceptor.startTime
    const rowsAffected = response?.data?.length || response?.count || 0

    if (this.config.logging) {
      console.log(`💾 [DB] ${interceptor.operation.toUpperCase()} ${interceptor.table}`, {
        duration: `${duration}ms`,
        rows: rowsAffected,
        error: error?.message
      })
    }

    // Complete workflow debugger tracking
    if (workflowDebugger.isDebugEnabled() && dbOpId) {
      workflowDebugger.completeDatabaseOperation(
        dbOpId,
        response?.data,
        rowsAffected,
        error?.message
      )
    }

    this.activeInterceptors.delete(interceptorId)
  }

  // Utility methods for snapshot management
  private async getAllTables(): Promise<Record<string, any[]>> {
    const tables = {
      // Core tables - adjust based on your schema
      analysis_snapshots: [],
      strategies: [],
      strategy_versions: [],
      patches: [],
      campaigns: [],
      briefs: [],
      artifacts: [],
      step_events: [],
      projects: []
    }

    for (const tableName of Object.keys(tables)) {
      try {
        const { data, error } = await this.client.from(tableName as any).select('*')
        if (!error && data) {
          (tables as any)[tableName] = data
        }
      } catch (error) {
        console.warn(`Could not snapshot table ${tableName}:`, error)
      }
    }

    return tables
  }

  private async clearAllTables(): Promise<void> {
    const tableNames = Object.keys(await this.getAllTables())

    for (const tableName of tableNames) {
      try {
        await this.client.from(tableName as any).delete().neq('id', 'impossible-value')
        console.log(`   🧹 Cleared table: ${tableName}`)
      } catch (error) {
        console.warn(`Could not clear table ${tableName}:`, error)
      }
    }
  }

  private calculateTotalSize(tables: Record<string, any[]>): number {
    return Object.values(tables).reduce((total, rows) => {
      return total + JSON.stringify(rows).length
    }, 0)
  }

  private async saveSnapshotToFile(snapshot: DatabaseSnapshot): Promise<void> {
    try {
      const fs = await import('fs')
      const path = await import('path')

      const cacheDir = path.join('.cache', 'snapshots')
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true })
      }

      const snapshotPath = path.join(cacheDir, `${snapshot.id}.json`)
      fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2))
    } catch (error) {
      console.warn('Could not save snapshot to file:', error)
    }
  }

  private async loadSnapshotFromFile(snapshotId: string): Promise<DatabaseSnapshot | null> {
    try {
      const fs = await import('fs')
      const path = await import('path')

      const snapshotPath = path.join('.cache', 'snapshots', `${snapshotId}.json`)
      if (!fs.existsSync(snapshotPath)) return null

      const content = fs.readFileSync(snapshotPath, 'utf-8')
      const snapshot = JSON.parse(content) as DatabaseSnapshot
      this.snapshots.set(snapshotId, snapshot)
      return snapshot
    } catch (error) {
      console.warn('Could not load snapshot from file:', error)
      return null
    }
  }

  // Test utilities
  async prepareTestEnvironment(): Promise<void> {
    if (!this.isTestMode) {
      throw new Error('Can only prepare test environment in test mode')
    }

    console.log('🧪 Preparing test environment...')

    // Clear all test data
    await this.clearAllTables()

    // Create baseline snapshot
    await this.createSnapshot('clean_state', 'Empty database for testing')

    console.log('✅ Test environment ready')
  }

  async resetToCleanState(): Promise<void> {
    if (!this.isTestMode) {
      throw new Error('Can only reset in test mode')
    }

    const cleanSnapshots = Array.from(this.snapshots.values())
      .filter(s => s.name === 'clean_state')

    if (cleanSnapshots.length > 0) {
      await this.restoreSnapshot(cleanSnapshots[0].id)
    } else {
      await this.clearAllTables()
    }
  }

  // Performance analytics
  getSlowQueries(thresholdMs: number = 1000): Array<{table: string, operation: string, duration: number}> {
    return Array.from(this.activeInterceptors.values())
      .filter(interceptor => {
        const duration = Date.now() - interceptor.startTime
        return duration > thresholdMs
      })
      .map(interceptor => ({
        table: interceptor.table,
        operation: interceptor.operation,
        duration: Date.now() - interceptor.startTime
      }))
  }

  // Configuration
  getConfig(): DatabaseConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<DatabaseConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  isInTestMode(): boolean {
    return this.isTestMode
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance()

// Export convenience functions
export function withTestDatabase<T>(fn: () => Promise<T>): Promise<T> {
  return databaseManager.switchMode('test')
    .then(() => databaseManager.prepareTestEnvironment())
    .then(() => fn())
    .finally(() => databaseManager.switchMode('production'))
}

export function createTestSnapshot(name: string): Promise<string> {
  return databaseManager.createSnapshot(name, `Test snapshot: ${name}`)
}

export function restoreTestSnapshot(snapshotId: string): Promise<void> {
  return databaseManager.restoreSnapshot(snapshotId)
}

// Replace the original supabase client with the managed one
export const supabase = databaseManager.getClient()

export { DatabaseManager }