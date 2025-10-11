/**
 * Workflow Execution Wrapper - Orchestrates debugging features around workflow execution
 */

import { v4 as uuidv4 } from 'uuid'
import type { WorkflowExecution, ReplayConfig, PerformanceMetrics } from './types'
import { workflowDebugger, debugWorkflow, debugStep } from './workflow-debugger'
import { databaseManager } from './database-manager'
import { llmCache, cacheLLMCall } from './llm-cache'
import { scenarioManager } from './scenario-manager'

interface ExecutionConfig {
  name: string
  enableDebug?: boolean
  enableCache?: boolean
  useTestDb?: boolean
  correlationId?: string
  parentExecutionId?: string
  breakpoints?: string[]
  overrides?: Record<string, any>
}

interface BreakpointContext {
  stepName: string
  stepId: string
  input: any
  execution: WorkflowExecution
  canContinue: () => Promise<void>
  canSkip: () => Promise<void>
  canModifyInput: (newInput: any) => void
}

type BreakpointHandler = (context: BreakpointContext) => Promise<void>

class WorkflowExecutor {
  private static instance: WorkflowExecutor
  private breakpointHandlers: Map<string, BreakpointHandler> = new Map()
  private activeBreakpoints: Set<string> = new Set()

  constructor() {
    console.log('🎯 Workflow Executor initialized')
  }

  static getInstance(): WorkflowExecutor {
    if (!WorkflowExecutor.instance) {
      WorkflowExecutor.instance = new WorkflowExecutor()
    }
    return WorkflowExecutor.instance
  }

  // Main execution wrapper
  async execute<T>(
    workflowFunction: () => Promise<T>,
    config: ExecutionConfig
  ): Promise<{
    result: T | null
    execution: WorkflowExecution | null
    error?: Error
    performance?: PerformanceMetrics
  }> {
    console.log(`🎯▶️ Executing workflow: ${config.name}`)

    // Setup environment
    await this.setupEnvironment(config)

    // Setup debugging if enabled
    if (config.enableDebug !== false) {
      workflowDebugger.updateConfig({ enabled: true })
    }

    let result: T | null = null
    let error: Error | undefined
    let executionId: string = ''

    try {
      // Execute with debugging wrapper
      result = await debugWorkflow(config.name, async (debug) => {
        executionId = debug.getCurrentExecution()?.id || ''

        // Apply any execution overrides
        if (config.overrides) {
          await this.applyOverrides(config.overrides)
        }

        // Execute the workflow
        return await workflowFunction()
      }, 'api')

    } catch (err) {
      error = err as Error
      console.error(`🎯❌ Workflow execution failed: ${config.name}`, err)
    }

    // Get execution details
    const execution = executionId ? workflowDebugger.exportExecution(executionId) : null
    const performance = executionId ? workflowDebugger.getPerformanceMetrics(executionId) : undefined

    return {
      result,
      execution,
      error,
      performance
    }
  }

  // Replay from previous execution
  async replay<T>(
    workflowFunction: () => Promise<T>,
    replayConfig: ReplayConfig
  ): Promise<{
    result: T | null
    execution: WorkflowExecution | null
    error?: Error
  }> {
    console.log(`🎯🔄 Replaying workflow from execution: ${replayConfig.workflow_execution_id}`)

    // Get original execution
    const originalExecution = workflowDebugger.exportExecution(replayConfig.workflow_execution_id)
    if (!originalExecution) {
      throw new Error(`Original execution ${replayConfig.workflow_execution_id} not found`)
    }

    // Setup environment
    await this.setupEnvironment({
      name: `${originalExecution.name}_replay`,
      enableDebug: true,
      enableCache: replayConfig.use_cache,
      useTestDb: replayConfig.target_environment === 'test',
      parentExecutionId: replayConfig.workflow_execution_id
    })

    // Restore database snapshot if specified
    if (replayConfig.snapshot_id) {
      await databaseManager.restoreSnapshot(replayConfig.snapshot_id)
    }

    // Set up cache with previous responses if using cache
    if (replayConfig.use_cache) {
      await this.setupReplayCache(originalExecution, replayConfig.start_from_step)
    }

    // Apply data overrides
    if (replayConfig.override_data) {
      await this.applyOverrides(replayConfig.override_data)
    }

    // Execute workflow
    return await this.execute(workflowFunction, {
      name: `${originalExecution.name}_replay`,
      parentExecutionId: originalExecution.id
    })
  }

  // Step-by-step execution with breakpoints
  async executeWithBreakpoints<T>(
    workflowFunction: () => Promise<T>,
    config: ExecutionConfig,
    breakpointHandler?: BreakpointHandler
  ): Promise<{
    result: T | null
    execution: WorkflowExecution | null
    error?: Error
  }> {
    // Set active breakpoints
    if (config.breakpoints) {
      config.breakpoints.forEach(bp => this.activeBreakpoints.add(bp))
    }

    // Set breakpoint handler
    if (breakpointHandler) {
      const handlerId = uuidv4()
      this.breakpointHandlers.set(handlerId, breakpointHandler)
    }

    try {
      return await this.execute(workflowFunction, config)
    } finally {
      // Clean up breakpoints
      this.activeBreakpoints.clear()
      this.breakpointHandlers.clear()
    }
  }

  // Enhanced step wrapper with breakpoint support
  async executeStep<T>(
    name: string,
    type: 'llm_call' | 'database_operation' | 'api_call' | 'decision_point' | 'tool_execution' | 'user_interaction',
    stepFunction: () => Promise<T>,
    input?: any
  ): Promise<T> {
    return await debugStep(name, type, async (stepId) => {
      // Check for breakpoint
      if (this.activeBreakpoints.has(name)) {
        await this.handleBreakpoint(name, stepId, input)
      }

      // Execute the step
      return await stepFunction()
    }, input)
  }

  // LLM call wrapper with caching and debugging
  async executeLLMCall<T>(
    stepName: string,
    prompt: string,
    llmFunction: () => Promise<T>,
    options?: {
      model?: string
      temperature?: number
      forceRefresh?: boolean
      provider?: string
    }
  ): Promise<T> {
    const workflowName = workflowDebugger.getCurrentExecution()?.name || 'unknown_workflow'
    const { provider = 'gemini', model = 'gemini-pro', temperature = 0.7, forceRefresh = false } = options || {}

    // Use cache wrapper
    return await cacheLLMCall(
      workflowName,
      stepName,
      prompt,
      async () => {
        // Track LLM call in debugger
        const currentExecution = workflowDebugger.getCurrentExecution()
        const currentStep = currentExecution?.steps.slice(-1)[0]

        if (currentStep) {
          const callId = workflowDebugger.trackLLMCall(currentStep.id, provider, model, prompt)

          try {
            const startTime = Date.now()
            const response = await llmFunction()
            const duration = Date.now() - startTime

            workflowDebugger.completeLLMCall(callId, JSON.stringify(response), { total: 0 }, 0, false)

            return response
          } catch (error) {
            workflowDebugger.completeLLMCall(callId, '', undefined, 0, false)
            throw error
          }
        }

        return await llmFunction()
      },
      { model, temperature, forceRefresh }
    )
  }

  // Database operation wrapper with debugging
  async executeDatabaseOperation<T>(
    stepName: string,
    operation: string,
    table: string,
    query: string,
    dbFunction: () => Promise<T>,
    parameters?: any
  ): Promise<T> {
    const currentExecution = workflowDebugger.getCurrentExecution()
    const currentStep = currentExecution?.steps.slice(-1)[0]

    if (currentStep) {
      const opId = workflowDebugger.trackDatabaseOperation(currentStep.id, operation, table, query, parameters)

      try {
        const startTime = Date.now()
        const result = await dbFunction()
        const duration = Date.now() - startTime

        // Extract rows affected if possible
        let rowsAffected = 0
        if (result && typeof result === 'object') {
          if ('count' in result) rowsAffected = (result as any).count
          else if ('data' in result && Array.isArray((result as any).data)) {
            rowsAffected = (result as any).data.length
          }
        }

        workflowDebugger.completeDatabaseOperation(opId, result, rowsAffected)
        return result
      } catch (error) {
        workflowDebugger.completeDatabaseOperation(opId, undefined, 0, (error as Error).message)
        throw error
      }
    }

    return await dbFunction()
  }

  // Comparison utilities
  async compareExecutions(executionIdA: string, executionIdB: string): Promise<{
    summary: {
      totalDifferences: number
      criticalDifferences: number
      performanceDelta: number
    }
    stepDifferences: Array<{
      stepName: string
      differenceType: string
      details: any
    }>
    llmDifferences: Array<{
      callId: string
      differenceType: string
      details: any
    }>
    databaseDifferences: Array<{
      operationId: string
      differenceType: string
      details: any
    }>
  }> {
    const execA = workflowDebugger.exportExecution(executionIdA)
    const execB = workflowDebugger.exportExecution(executionIdB)

    if (!execA || !execB) {
      throw new Error('One or both executions not found')
    }

    const stepDifferences = this.compareSteps(execA.steps, execB.steps)
    const llmDifferences = this.compareLLMCalls(execA.llm_calls, execB.llm_calls)
    const databaseDifferences = this.compareDatabaseOperations(execA.database_operations, execB.database_operations)

    const totalDifferences = stepDifferences.length + llmDifferences.length + databaseDifferences.length
    const criticalDifferences = stepDifferences.filter(d => d.differenceType === 'different_status').length

    const performanceDelta = (execB.total_duration || 0) - (execA.total_duration || 0)

    return {
      summary: {
        totalDifferences,
        criticalDifferences,
        performanceDelta
      },
      stepDifferences,
      llmDifferences,
      databaseDifferences
    }
  }

  // Environment setup
  private async setupEnvironment(config: ExecutionConfig): Promise<void> {
    // Switch database mode if needed
    if (config.useTestDb && !databaseManager.isInTestMode()) {
      await databaseManager.switchMode('test')
      await databaseManager.prepareTestEnvironment()
    } else if (!config.useTestDb && databaseManager.isInTestMode()) {
      await databaseManager.switchMode('production')
    }

    // Configure cache
    if (config.enableCache !== false) {
      llmCache.updateConfig({ enabled: true })
    }
  }

  private async setupReplayCache(originalExecution: WorkflowExecution, startFromStep?: string): Promise<void> {
    // Pre-populate cache with responses from original execution
    const workflowName = originalExecution.name
    let shouldCache = !startFromStep

    for (const llmCall of originalExecution.llm_calls) {
      const step = originalExecution.steps.find(s => s.id === llmCall.step_id)
      if (!step) continue

      // Start caching from the specified step
      if (startFromStep && step.name === startFromStep) {
        shouldCache = true
      }

      if (shouldCache && llmCall.response) {
        await llmCache.set(
          workflowName,
          step.name,
          llmCall.prompt,
          JSON.parse(llmCall.response),
          llmCall.model,
          undefined,
          { replayed: true }
        )
      }
    }
  }

  private async applyOverrides(overrides: Record<string, any>): Promise<void> {
    // Apply overrides to cache, database, or environment
    for (const [key, value] of Object.entries(overrides)) {
      if (key.startsWith('cache_')) {
        // Cache override
        const [, workflowName, stepName] = key.split('_', 3)
        if (workflowName && stepName) {
          llmCache.setOverride(workflowName, stepName, 'override_prompt', value)
        }
      } else if (key.startsWith('env_')) {
        // Environment variable override
        const envKey = key.substring(4)
        process.env[envKey] = String(value)
      }
      // Add more override types as needed
    }
  }

  private async handleBreakpoint(stepName: string, stepId: string, input: any): Promise<void> {
    const execution = workflowDebugger.getCurrentExecution()
    if (!execution) return

    console.log(`🎯⏸️ Breakpoint hit: ${stepName}`)

    const context: BreakpointContext = {
      stepName,
      stepId,
      input,
      execution,
      canContinue: async () => {
        console.log(`🎯▶️ Continuing from breakpoint: ${stepName}`)
      },
      canSkip: async () => {
        console.log(`🎯⏭️ Skipping step: ${stepName}`)
        workflowDebugger.completeStep(stepId, { skipped: true })
      },
      canModifyInput: (newInput: any) => {
        console.log(`🎯🔧 Modified input for step: ${stepName}`)
        // Input modification would need to be handled by the calling code
      }
    }

    // Call all registered handlers
    for (const handler of this.breakpointHandlers.values()) {
      try {
        await handler(context)
      } catch (error) {
        console.error('Breakpoint handler error:', error)
      }
    }
  }

  // Comparison utility methods
  private compareSteps(stepsA: any[], stepsB: any[]): Array<{ stepName: string; differenceType: string; details: any }> {
    const differences: Array<{ stepName: string; differenceType: string; details: any }> = []

    const stepMapA = new Map(stepsA.map(s => [s.name, s]))
    const stepMapB = new Map(stepsB.map(s => [s.name, s]))

    // Check for missing steps
    for (const stepName of stepMapA.keys()) {
      if (!stepMapB.has(stepName)) {
        differences.push({
          stepName,
          differenceType: 'missing',
          details: { in: 'execution_b' }
        })
      }
    }

    for (const stepName of stepMapB.keys()) {
      if (!stepMapA.has(stepName)) {
        differences.push({
          stepName,
          differenceType: 'missing',
          details: { in: 'execution_a' }
        })
      }
    }

    // Compare existing steps
    for (const stepName of stepMapA.keys()) {
      const stepA = stepMapA.get(stepName)!
      const stepB = stepMapB.get(stepName)

      if (stepB) {
        if (stepA.status !== stepB.status) {
          differences.push({
            stepName,
            differenceType: 'different_status',
            details: { a: stepA.status, b: stepB.status }
          })
        }

        if (JSON.stringify(stepA.output) !== JSON.stringify(stepB.output)) {
          differences.push({
            stepName,
            differenceType: 'different_output',
            details: { a: stepA.output, b: stepB.output }
          })
        }

        const durationDiff = Math.abs((stepA.duration || 0) - (stepB.duration || 0))
        if (durationDiff > 1000) { // More than 1 second difference
          differences.push({
            stepName,
            differenceType: 'different_duration',
            details: { a: stepA.duration, b: stepB.duration, difference: durationDiff }
          })
        }
      }
    }

    return differences
  }

  private compareLLMCalls(callsA: any[], callsB: any[]): Array<{ callId: string; differenceType: string; details: any }> {
    const differences: Array<{ callId: string; differenceType: string; details: any }> = []

    // Simple comparison by index for now
    const maxLength = Math.max(callsA.length, callsB.length)

    for (let i = 0; i < maxLength; i++) {
      const callA = callsA[i]
      const callB = callsB[i]

      if (!callA || !callB) {
        differences.push({
          callId: callA?.id || callB?.id || `missing_${i}`,
          differenceType: 'missing_call',
          details: { missing_in: !callA ? 'execution_a' : 'execution_b' }
        })
        continue
      }

      if (callA.prompt !== callB.prompt) {
        differences.push({
          callId: callA.id,
          differenceType: 'different_prompt',
          details: { a: callA.prompt, b: callB.prompt }
        })
      }

      if (callA.response !== callB.response) {
        differences.push({
          callId: callA.id,
          differenceType: 'different_response',
          details: { a: callA.response, b: callB.response }
        })
      }

      const latencyDiff = Math.abs(callA.latency - callB.latency)
      if (latencyDiff > 2000) { // More than 2 seconds difference
        differences.push({
          callId: callA.id,
          differenceType: 'different_latency',
          details: { a: callA.latency, b: callB.latency, difference: latencyDiff }
        })
      }
    }

    return differences
  }

  private compareDatabaseOperations(opsA: any[], opsB: any[]): Array<{ operationId: string; differenceType: string; details: any }> {
    const differences: Array<{ operationId: string; differenceType: string; details: any }> = []

    const maxLength = Math.max(opsA.length, opsB.length)

    for (let i = 0; i < maxLength; i++) {
      const opA = opsA[i]
      const opB = opsB[i]

      if (!opA || !opB) {
        differences.push({
          operationId: opA?.id || opB?.id || `missing_${i}`,
          differenceType: 'missing_operation',
          details: { missing_in: !opA ? 'execution_a' : 'execution_b' }
        })
        continue
      }

      if (opA.query !== opB.query) {
        differences.push({
          operationId: opA.id,
          differenceType: 'different_query',
          details: { a: opA.query, b: opB.query }
        })
      }

      if (JSON.stringify(opA.result) !== JSON.stringify(opB.result)) {
        differences.push({
          operationId: opA.id,
          differenceType: 'different_result',
          details: { a: opA.result, b: opB.result }
        })
      }

      const timingDiff = Math.abs(opA.execution_time - opB.execution_time)
      if (timingDiff > 500) { // More than 500ms difference
        differences.push({
          operationId: opA.id,
          differenceType: 'different_timing',
          details: { a: opA.execution_time, b: opB.execution_time, difference: timingDiff }
        })
      }
    }

    return differences
  }

  // Utility methods
  async createSnapshot(name: string): Promise<string> {
    return await databaseManager.createSnapshot(name)
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    return await databaseManager.restoreSnapshot(snapshotId)
  }

  clearCache(): void {
    llmCache.clear()
  }

  getExecutionHistory(): WorkflowExecution[] {
    return workflowDebugger.getAllExecutions()
  }

  exportExecution(executionId: string): WorkflowExecution | null {
    return workflowDebugger.exportExecution(executionId)
  }
}

// Export singleton instance
export const workflowExecutor = WorkflowExecutor.getInstance()

// Export convenience functions
export function executeWorkflow<T>(
  workflowFunction: () => Promise<T>,
  config: ExecutionConfig
) {
  return workflowExecutor.execute(workflowFunction, config)
}

export function replayWorkflow<T>(
  workflowFunction: () => Promise<T>,
  replayConfig: ReplayConfig
) {
  return workflowExecutor.replay(workflowFunction, replayConfig)
}

export function executeWithDebug<T>(
  name: string,
  workflowFunction: () => Promise<T>
) {
  return workflowExecutor.execute(workflowFunction, {
    name,
    enableDebug: true,
    enableCache: true,
    useTestDb: true
  })
}

export { WorkflowExecutor }