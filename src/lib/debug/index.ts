/**
 * Automated Workflow Debugging System - Main entry point
 *
 * Provides a comprehensive debugging infrastructure for Next.js + Supabase workflows
 * with LLM integration, test automation, and performance analysis.
 */

// Core debugging infrastructure
export { workflowDebugger, debugWorkflow, debugStep } from './workflow-debugger'
export { databaseManager, supabase, withTestDatabase, createTestSnapshot, restoreTestSnapshot } from './database-manager'
export { llmCache, cacheLLMCall, setCachedResponse, clearLLMCache } from './llm-cache'
export { scenarioManager, createScenario, runScenario, runAllScenarios } from './scenario-manager'
export { workflowExecutor, executeWorkflow, replayWorkflow, executeWithDebug } from './workflow-executor'

// Types
export type {
  WorkflowExecution,
  WorkflowStep,
  LLMCallData,
  DatabaseOperation,
  DatabaseSnapshot,
  TestScenario,
  TestAssertion,
  CacheEntry,
  DebugSession,
  WorkflowDebugConfig,
  DebugEvent,
  ReplayConfig,
  PerformanceMetrics,
  WorkflowComparison
} from './types'

// Utility functions for easy integration
import { workflowDebugger } from './workflow-debugger'
import { databaseManager } from './database-manager'
import { llmCache } from './llm-cache'
import { scenarioManager } from './scenario-manager'
import { workflowExecutor } from './workflow-executor'

/**
 * Initialize the debugging system with configuration
 */
export function initializeDebugSystem(config?: {
  enabled?: boolean
  mode?: 'development' | 'test' | 'production'
  llmCache?: boolean
  testDatabase?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
}) {
  const debugConfig = {
    enabled: config?.enabled ?? process.env.NEXT_PUBLIC_DEBUG_WORKFLOWS === 'true',
    mode: config?.mode ?? (process.env.NODE_ENV as any) ?? 'development',
    database: {
      use_test_db: config?.testDatabase ?? process.env.NEXT_PUBLIC_USE_TEST_DB === 'true',
      test_db_url: process.env.NEXT_PUBLIC_TEST_SUPABASE_URL,
      auto_snapshot: true,
      snapshot_frequency: 5
    },
    llm_cache: {
      enabled: config?.llmCache ?? process.env.NEXT_PUBLIC_LLM_CACHE_ENABLED === 'true',
      directory: process.env.NEXT_PUBLIC_LLM_CACHE_DIR || '.cache/llm-responses',
      versioning: true,
      auto_generate: true
    },
    logging: {
      level: config?.logLevel ?? (process.env.NEXT_PUBLIC_DEBUG_LOG_LEVEL as any) ?? 'debug',
      include_stacks: true,
      max_payload_size: 10000
    },
    performance: {
      track_all_calls: true,
      slow_query_threshold: 1000,
      slow_llm_threshold: 5000
    }
  }

  // Update all components with configuration
  workflowDebugger.updateConfig(debugConfig)

  if (debugConfig.enabled) {
    console.log('🔍 Workflow Debug System initialized', {
      mode: debugConfig.mode,
      llmCache: debugConfig.llm_cache.enabled,
      testDb: debugConfig.database.use_test_db,
      logLevel: debugConfig.logging.level
    })
  }

  return debugConfig
}

/**
 * Create a complete test session with scenarios and environment setup
 */
export async function createTestSession(name: string, scenarios?: string[]) {
  console.log(`🧪 Creating test session: ${name}`)

  // Switch to test environment
  await databaseManager.switchMode('test')
  await databaseManager.prepareTestEnvironment()

  // Clear cache for fresh start
  llmCache.clear()

  // Load scenarios if provided
  if (scenarios) {
    for (const scenarioFile of scenarios) {
      try {
        await scenarioManager.loadScenariosFromFile(`src/lib/debug/scenarios/${scenarioFile}.json`)
      } catch (error) {
        console.warn(`Could not load scenario ${scenarioFile}:`, error)
      }
    }
  }

  // Create initial snapshot
  const snapshotId = await databaseManager.createSnapshot(`${name}_initial`, `Initial state for test session ${name}`)

  console.log(`✅ Test session ready: ${name}`, {
    snapshot: snapshotId,
    scenarios: scenarios?.length || 0
  })

  return snapshotId
}

/**
 * Run a complete test suite with reporting
 */
export async function runTestSuite(
  workflowFunction: () => Promise<any>,
  options?: {
    scenarios?: string[]
    parallel?: boolean
    timeout?: number
    continueOnFailure?: boolean
  }
) {
  console.log('🏁 Starting test suite execution')

  const scenarioIds = options?.scenarios || scenarioManager.listScenarios().map(s => s.id)

  const results = await scenarioManager.runMultipleScenarios(
    scenarioIds,
    workflowFunction,
    {
      parallel: options?.parallel || false,
      timeout: options?.timeout || 30000,
      continueOnFailure: options?.continueOnFailure || true
    }
  )

  const report = scenarioManager.generateReport(scenarioIds)

  console.log('📊 Test Suite Results:', {
    total: report.summary.total,
    passed: report.summary.passed,
    failed: report.summary.failed,
    passRate: `${report.summary.passRate.toFixed(1)}%`,
    totalDuration: `${report.summary.totalDuration}ms`
  })

  // Log failed scenarios
  const failures = results.filter(r => !r.success)
  if (failures.length > 0) {
    console.error('❌ Failed scenarios:')
    failures.forEach(failure => {
      console.error(`  - ${failure.scenario.name}: ${failure.error?.message || 'Assertion failures'}`)
      if (failure.failures.length > 0) {
        failure.failures.forEach(f => {
          console.error(`    • ${f.assertion.description}: expected ${f.expected}, got ${f.actual}`)
        })
      }
    })
  }

  return report
}

/**
 * Generate performance report for workflow executions
 */
export function generatePerformanceReport(executionIds: string[]) {
  const executions = executionIds
    .map(id => workflowDebugger.exportExecution(id))
    .filter(Boolean) as WorkflowExecution[]

  if (executions.length === 0) {
    return null
  }

  const totalDuration = executions.reduce((sum, exec) => sum + (exec.total_duration || 0), 0)
  const avgDuration = totalDuration / executions.length

  const llmCallCount = executions.reduce((sum, exec) => sum + exec.llm_calls.length, 0)
  const avgLLMLatency = executions.reduce((sum, exec) => {
    const execAvg = exec.llm_calls.reduce((s, call) => s + call.latency, 0) / exec.llm_calls.length
    return sum + (execAvg || 0)
  }, 0) / executions.length

  const dbOpCount = executions.reduce((sum, exec) => sum + exec.database_operations.length, 0)
  const avgDbLatency = executions.reduce((sum, exec) => {
    const execAvg = exec.database_operations.reduce((s, op) => s + op.execution_time, 0) / exec.database_operations.length
    return sum + (execAvg || 0)
  }, 0) / executions.length

  const totalCost = executions.reduce((sum, exec) => sum + (exec.total_cost || 0), 0)

  return {
    summary: {
      executions: executions.length,
      totalDuration,
      avgDuration,
      totalCost,
      avgCost: totalCost / executions.length
    },
    llm: {
      totalCalls: llmCallCount,
      avgLatency: avgLLMLatency,
      avgCallsPerExecution: llmCallCount / executions.length
    },
    database: {
      totalOperations: dbOpCount,
      avgLatency: avgDbLatency,
      avgOperationsPerExecution: dbOpCount / executions.length
    },
    cacheStats: llmCache.getStats()
  }
}

/**
 * Export debug session for sharing
 */
export function exportDebugSession(sessionName: string, executionIds?: string[]) {
  const executions = executionIds
    ? executionIds.map(id => workflowDebugger.exportExecution(id)).filter(Boolean)
    : workflowDebugger.getAllExecutions()

  const scenarios = scenarioManager.exportScenarios()
  const cacheEntries = llmCache.exportCache()
  const cacheStats = llmCache.getStats()

  return {
    sessionName,
    timestamp: new Date().toISOString(),
    executions,
    scenarios,
    cache: {
      entries: cacheEntries,
      stats: cacheStats
    },
    environment: {
      node_env: process.env.NODE_ENV,
      debug_enabled: workflowDebugger.isDebugEnabled(),
      test_db: databaseManager.isInTestMode()
    }
  }
}

/**
 * Cleanup function to reset all debugging state
 */
export async function cleanupDebugSystem() {
  console.log('🧹 Cleaning up debug system')

  // Clear all state
  workflowDebugger.clear()
  llmCache.clear()
  scenarioManager.clearResults()

  // Reset to production database if in test mode
  if (databaseManager.isInTestMode()) {
    await databaseManager.switchMode('production')
  }

  console.log('✅ Debug system cleanup complete')
}

/**
 * Quick setup for common debugging scenarios
 */
export const QuickSetup = {
  /**
   * Setup for development debugging
   */
  async development() {
    return initializeDebugSystem({
      enabled: true,
      mode: 'development',
      llmCache: true,
      testDatabase: false,
      logLevel: 'debug'
    })
  },

  /**
   * Setup for automated testing
   */
  async testing() {
    const config = initializeDebugSystem({
      enabled: true,
      mode: 'test',
      llmCache: true,
      testDatabase: true,
      logLevel: 'info'
    })

    await createTestSession('automated_test', [
      'happy-path',
      'approval-needed',
      'llm-error',
      'strategy-change',
      'database-conflict'
    ])

    return config
  },

  /**
   * Setup for production monitoring (minimal overhead)
   */
  async production() {
    return initializeDebugSystem({
      enabled: false,
      mode: 'production',
      llmCache: false,
      testDatabase: false,
      logLevel: 'error'
    })
  }
}

// Initialize with environment defaults
if (typeof window === 'undefined' && process.env.NEXT_PUBLIC_DEBUG_WORKFLOWS === 'true') {
  initializeDebugSystem()
}