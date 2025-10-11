/**
 * Workflow State Tracker - Core debugging system for capturing and tracking workflow execution
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  WorkflowExecution,
  WorkflowStep,
  LLMCallData,
  DatabaseOperation,
  DebugEvent,
  WorkflowDebugConfig,
  PerformanceMetrics,
  WorkflowComparison
} from './types'

class WorkflowDebugger {
  private static instance: WorkflowDebugger
  private executions: Map<string, WorkflowExecution> = new Map()
  private activeExecution: WorkflowExecution | null = null
  private config: WorkflowDebugConfig
  private eventListeners: Array<(event: DebugEvent) => void> = []
  private isEnabled: boolean = false

  constructor(config?: Partial<WorkflowDebugConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEBUG_WORKFLOWS === 'true',
      mode: (process.env.NODE_ENV as any) || 'development',
      database: {
        use_test_db: process.env.NEXT_PUBLIC_USE_TEST_DB === 'true',
        test_db_url: process.env.NEXT_PUBLIC_TEST_SUPABASE_URL,
        auto_snapshot: true,
        snapshot_frequency: 5
      },
      llm_cache: {
        enabled: process.env.NEXT_PUBLIC_LLM_CACHE_ENABLED === 'true',
        directory: process.env.NEXT_PUBLIC_LLM_CACHE_DIR || '.cache/llm-responses',
        versioning: true,
        auto_generate: true
      },
      logging: {
        level: (process.env.NEXT_PUBLIC_DEBUG_LOG_LEVEL as any) || 'debug',
        include_stacks: true,
        max_payload_size: 10000
      },
      performance: {
        track_all_calls: true,
        slow_query_threshold: 1000,
        slow_llm_threshold: 5000
      },
      ...config
    }

    this.isEnabled = this.config.enabled

    if (this.isEnabled) {
      console.log('🔍 Workflow Debugger initialized', {
        mode: this.config.mode,
        llm_cache: this.config.llm_cache.enabled,
        test_db: this.config.database.use_test_db
      })
    }
  }

  static getInstance(config?: Partial<WorkflowDebugConfig>): WorkflowDebugger {
    if (!WorkflowDebugger.instance) {
      WorkflowDebugger.instance = new WorkflowDebugger(config)
    }
    return WorkflowDebugger.instance
  }

  // Main workflow execution tracking
  startWorkflow(name: string, trigger: string = 'user', correlationId?: string): string {
    if (!this.isEnabled) return ''

    const execution: WorkflowExecution = {
      id: uuidv4(),
      name,
      correlation_id: correlationId || uuidv4(),
      start_time: new Date().toISOString(),
      status: 'running',
      trigger: trigger as any,
      steps: [],
      llm_calls: [],
      database_operations: [],
      environment: this.config.mode
    }

    this.executions.set(execution.id, execution)
    this.activeExecution = execution

    this.emitEvent({
      type: 'step_started',
      workflow_id: execution.id,
      data: { name, trigger },
      timestamp: execution.start_time
    })

    this.log('info', `🚀 Started workflow: ${name}`, { execution_id: execution.id })
    return execution.id
  }

  addStep(name: string, type: WorkflowStep['type'], input?: any): string {
    if (!this.isEnabled || !this.activeExecution) return ''

    const step: WorkflowStep = {
      id: uuidv4(),
      name,
      type,
      timestamp: new Date().toISOString(),
      status: 'pending',
      input: this.sanitizePayload(input),
      metadata: {
        correlation_id: this.activeExecution.correlation_id,
        workflow_name: this.activeExecution.name,
        component: typeof window !== 'undefined' ? 'frontend' : 'backend'
      }
    }

    this.activeExecution.steps.push(step)

    this.emitEvent({
      type: 'step_started',
      workflow_id: this.activeExecution.id,
      step_id: step.id,
      data: { name, type, input: step.input },
      timestamp: step.timestamp
    })

    this.log('debug', `📝 Added step: ${name}`, { step_id: step.id, type })
    return step.id
  }

  startStep(stepId: string): void {
    if (!this.isEnabled || !this.activeExecution) return

    const step = this.activeExecution.steps.find(s => s.id === stepId)
    if (!step) return

    step.status = 'running'
    step.timestamp = new Date().toISOString()

    this.log('debug', `▶️ Started step: ${step.name}`, { step_id: stepId })
  }

  completeStep(stepId: string, output?: any, error?: any): void {
    if (!this.isEnabled || !this.activeExecution) return

    const step = this.activeExecution.steps.find(s => s.id === stepId)
    if (!step) return

    const now = new Date().toISOString()
    step.status = error ? 'failed' : 'completed'
    step.output = this.sanitizePayload(output)
    step.duration = new Date(now).getTime() - new Date(step.timestamp).getTime()

    if (error) {
      step.error = {
        message: error.message || String(error),
        stack: error.stack,
        code: error.code
      }
    }

    this.emitEvent({
      type: error ? 'step_failed' : 'step_completed',
      workflow_id: this.activeExecution.id,
      step_id: stepId,
      data: { output: step.output, error: step.error, duration: step.duration },
      timestamp: now
    })

    this.log(error ? 'error' : 'debug',
      `${error ? '❌' : '✅'} ${error ? 'Failed' : 'Completed'} step: ${step.name}`,
      { step_id: stepId, duration: step.duration, error: step.error?.message }
    )
  }

  // LLM call tracking
  trackLLMCall(stepId: string, provider: string, model: string, prompt: string): string {
    if (!this.isEnabled || !this.activeExecution) return ''

    const llmCall: LLMCallData = {
      id: uuidv4(),
      step_id: stepId,
      provider: provider as any,
      model,
      prompt: this.sanitizePayload(prompt),
      response: '',
      latency: 0,
      timestamp: new Date().toISOString()
    }

    this.activeExecution.llm_calls.push(llmCall)

    this.emitEvent({
      type: 'llm_call',
      workflow_id: this.activeExecution.id,
      step_id: stepId,
      data: { provider, model, prompt_length: prompt.length },
      timestamp: llmCall.timestamp
    })

    this.log('debug', `🤖 LLM call started: ${provider}/${model}`, {
      llm_call_id: llmCall.id,
      step_id: stepId,
      prompt_length: prompt.length
    })

    return llmCall.id
  }

  completeLLMCall(callId: string, response: string, tokens?: any, cost?: number, cacheHit?: boolean): void {
    if (!this.isEnabled || !this.activeExecution) return

    const llmCall = this.activeExecution.llm_calls.find(c => c.id === callId)
    if (!llmCall) return

    const now = new Date().toISOString()
    llmCall.response = this.sanitizePayload(response)
    llmCall.latency = new Date(now).getTime() - new Date(llmCall.timestamp).getTime()
    llmCall.tokens_used = tokens
    llmCall.cost = cost
    llmCall.cache_hit = cacheHit

    this.log('debug', `🤖 LLM call completed: ${llmCall.provider}/${llmCall.model}`, {
      llm_call_id: callId,
      latency: llmCall.latency,
      cache_hit: cacheHit,
      tokens: tokens?.total,
      cost
    })
  }

  // Database operation tracking
  trackDatabaseOperation(stepId: string, operation: string, table: string, query: string, parameters?: any): string {
    if (!this.isEnabled || !this.activeExecution) return ''

    const dbOp: DatabaseOperation = {
      id: uuidv4(),
      step_id: stepId,
      operation: operation as any,
      table,
      query: this.sanitizePayload(query),
      parameters: this.sanitizePayload(parameters),
      execution_time: 0,
      timestamp: new Date().toISOString()
    }

    this.activeExecution.database_operations.push(dbOp)

    this.emitEvent({
      type: 'db_operation',
      workflow_id: this.activeExecution.id,
      step_id: stepId,
      data: { operation, table, query },
      timestamp: dbOp.timestamp
    })

    this.log('debug', `💾 Database operation: ${operation} on ${table}`, {
      db_op_id: dbOp.id,
      step_id: stepId
    })

    return dbOp.id
  }

  completeDatabaseOperation(opId: string, result?: any, rowsAffected?: number, error?: string): void {
    if (!this.isEnabled || !this.activeExecution) return

    const dbOp = this.activeExecution.database_operations.find(op => op.id === opId)
    if (!dbOp) return

    const now = new Date().toISOString()
    dbOp.execution_time = new Date(now).getTime() - new Date(dbOp.timestamp).getTime()
    dbOp.result = this.sanitizePayload(result)
    dbOp.rows_affected = rowsAffected
    dbOp.error = error

    if (dbOp.execution_time > this.config.performance.slow_query_threshold) {
      this.log('warn', `🐌 Slow database query detected: ${dbOp.operation} on ${dbOp.table}`, {
        execution_time: dbOp.execution_time,
        threshold: this.config.performance.slow_query_threshold
      })
    }

    this.log('debug', `💾 Database operation completed: ${dbOp.operation} on ${dbOp.table}`, {
      db_op_id: opId,
      execution_time: dbOp.execution_time,
      rows_affected: rowsAffected,
      error
    })
  }

  // Workflow completion
  completeWorkflow(output?: any, error?: any): void {
    if (!this.isEnabled || !this.activeExecution) return

    const now = new Date().toISOString()
    this.activeExecution.end_time = now
    this.activeExecution.status = error ? 'failed' : 'completed'
    this.activeExecution.total_duration = new Date(now).getTime() - new Date(this.activeExecution.start_time).getTime()

    // Calculate total cost
    this.activeExecution.total_cost = this.activeExecution.llm_calls.reduce((sum, call) => sum + (call.cost || 0), 0)

    this.log('info', `🏁 Workflow ${error ? 'failed' : 'completed'}: ${this.activeExecution.name}`, {
      execution_id: this.activeExecution.id,
      duration: this.activeExecution.total_duration,
      total_cost: this.activeExecution.total_cost,
      steps_count: this.activeExecution.steps.length,
      llm_calls_count: this.activeExecution.llm_calls.length,
      db_operations_count: this.activeExecution.database_operations.length,
      error: error?.message
    })

    this.activeExecution = null
  }

  // Export and analysis methods
  exportExecution(executionId: string): WorkflowExecution | null {
    if (!this.isEnabled) return null
    return this.executions.get(executionId) || null
  }

  exportAllExecutions(): WorkflowExecution[] {
    if (!this.isEnabled) return []
    return Array.from(this.executions.values())
  }

  getPerformanceMetrics(executionId: string): PerformanceMetrics | null {
    if (!this.isEnabled) return null

    const execution = this.executions.get(executionId)
    if (!execution || !execution.total_duration) return null

    const stepDurations = execution.steps.reduce((acc, step) => {
      if (step.duration) acc[step.name] = step.duration
      return acc
    }, {} as Record<string, number>)

    const llmCallDurations = execution.llm_calls.reduce((acc, call) => {
      acc[call.id] = call.latency
      return acc
    }, {} as Record<string, number>)

    const dbOpDurations = execution.database_operations.reduce((acc, op) => {
      acc[op.id] = op.execution_time
      return acc
    }, {} as Record<string, number>)

    // Find bottlenecks
    const allDurations = [
      ...execution.steps.map(s => ({ type: 'step' as const, identifier: s.name, duration: s.duration || 0 })),
      ...execution.llm_calls.map(c => ({ type: 'llm' as const, identifier: c.id, duration: c.latency })),
      ...execution.database_operations.map(d => ({ type: 'database' as const, identifier: d.id, duration: d.execution_time }))
    ].sort((a, b) => b.duration - a.duration)

    const bottlenecks = allDurations.slice(0, 5).map(item => ({
      ...item,
      percentage_of_total: (item.duration / execution.total_duration!) * 100
    }))

    return {
      workflow_id: executionId,
      total_duration: execution.total_duration,
      step_durations: stepDurations,
      llm_call_durations: llmCallDurations,
      database_operation_durations: dbOpDurations,
      bottlenecks,
      cost_breakdown: {
        llm_calls: execution.total_cost || 0,
        database_operations: 0, // Could be calculated based on query complexity
        total: execution.total_cost || 0
      }
    }
  }

  // Event subscription for real-time debugging
  addEventListener(listener: (event: DebugEvent) => void): () => void {
    if (!this.isEnabled) return () => {}

    this.eventListeners.push(listener)
    return () => {
      const index = this.eventListeners.indexOf(listener)
      if (index > -1) this.eventListeners.splice(index, 1)
    }
  }

  // Utility methods
  private emitEvent(event: DebugEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Debug event listener error:', error)
      }
    })
  }

  private sanitizePayload(payload: any): any {
    if (!payload) return payload

    const serialized = JSON.stringify(payload)
    if (serialized.length > this.config.logging.max_payload_size) {
      return serialized.substring(0, this.config.logging.max_payload_size) + '...[truncated]'
    }

    return payload
  }

  private log(level: string, message: string, data?: any): void {
    if (!this.isEnabled) return

    const logLevels = ['debug', 'info', 'warn', 'error']
    const configLevel = logLevels.indexOf(this.config.logging.level)
    const messageLevel = logLevels.indexOf(level)

    if (messageLevel >= configLevel) {
      console[level as 'debug' | 'info' | 'warn' | 'error'](`[WorkflowDebugger] ${message}`, data || '')
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<WorkflowDebugConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.isEnabled = this.config.enabled
  }

  getConfig(): WorkflowDebugConfig {
    return { ...this.config }
  }

  // State management
  clear(): void {
    this.executions.clear()
    this.activeExecution = null
  }

  isDebugEnabled(): boolean {
    return this.isEnabled
  }

  getCurrentExecution(): WorkflowExecution | null {
    return this.activeExecution
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values())
  }
}

// Export singleton instance
export const workflowDebugger = WorkflowDebugger.getInstance()

// Export convenience functions for easy integration
export function debugWorkflow<T>(
  name: string,
  fn: (debug: WorkflowDebugger) => Promise<T>,
  trigger?: string
): Promise<T> {
  const executionId = workflowDebugger.startWorkflow(name, trigger)

  return fn(workflowDebugger)
    .then(result => {
      workflowDebugger.completeWorkflow(result)
      return result
    })
    .catch(error => {
      workflowDebugger.completeWorkflow(undefined, error)
      throw error
    })
}

export function debugStep<T>(
  name: string,
  type: WorkflowStep['type'],
  fn: (stepId: string) => Promise<T>,
  input?: any
): Promise<T> {
  const stepId = workflowDebugger.addStep(name, type, input)
  workflowDebugger.startStep(stepId)

  return fn(stepId)
    .then(result => {
      workflowDebugger.completeStep(stepId, result)
      return result
    })
    .catch(error => {
      workflowDebugger.completeStep(stepId, undefined, error)
      throw error
    })
}

export { WorkflowDebugger }