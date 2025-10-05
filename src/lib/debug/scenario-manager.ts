/**
 * Test Scenario System - Manage and execute test scenarios with assertions
 */

import { v4 as uuidv4 } from 'uuid'
import type { TestScenario, TestAssertion, WorkflowExecution } from './types'
import { workflowDebugger } from './workflow-debugger'
import { databaseManager } from './database-manager'
import { llmCache } from './llm-cache'

interface ScenarioResult {
  scenario: TestScenario
  execution: WorkflowExecution | null
  success: boolean
  failures: Array<{
    assertion: TestAssertion
    expected: any
    actual: any
    message: string
  }>
  duration: number
  error?: Error
}

interface ScenarioRunConfig {
  timeout?: number
  skipAssertions?: boolean
  continueOnFailure?: boolean
  captureOutput?: boolean
}

class ScenarioManager {
  private static instance: ScenarioManager
  private scenarios: Map<string, TestScenario> = new Map()
  private results: Map<string, ScenarioResult> = new Map()

  constructor() {
    console.log('🎭 Scenario Manager initialized')
  }

  static getInstance(): ScenarioManager {
    if (!ScenarioManager.instance) {
      ScenarioManager.instance = new ScenarioManager()
    }
    return ScenarioManager.instance
  }

  // Scenario management
  addScenario(scenario: TestScenario): void {
    this.scenarios.set(scenario.id, scenario)
    console.log(`🎭 Added scenario: ${scenario.name}`)
  }

  removeScenario(scenarioId: string): void {
    this.scenarios.delete(scenarioId)
    this.results.delete(scenarioId)
    console.log(`🎭 Removed scenario: ${scenarioId}`)
  }

  getScenario(scenarioId: string): TestScenario | undefined {
    return this.scenarios.get(scenarioId)
  }

  listScenarios(): TestScenario[] {
    return Array.from(this.scenarios.values())
  }

  getScenariosByTag(tag: string): TestScenario[] {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.tags?.includes(tag))
  }

  getScenariosByWorkflow(workflowName: string): TestScenario[] {
    return Array.from(this.scenarios.values())
      .filter(scenario => scenario.workflow_name === workflowName)
  }

  // Scenario execution
  async runScenario(
    scenarioId: string,
    workflowFunction: () => Promise<any>,
    config?: ScenarioRunConfig
  ): Promise<ScenarioResult> {
    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    console.log(`🎭▶️ Running scenario: ${scenario.name}`)

    const startTime = Date.now()
    let execution: WorkflowExecution | null = null
    let workflowOutput: any = null
    let workflowError: Error | undefined

    try {
      // Setup scenario environment
      await this.setupScenario(scenario)

      // Execute workflow with timeout
      const timeoutMs = config?.timeout || 30000
      workflowOutput = await this.executeWithTimeout(workflowFunction, timeoutMs)

      // Get execution details
      execution = workflowDebugger.getCurrentExecution()

    } catch (error) {
      workflowError = error as Error
      console.error(`🎭❌ Scenario execution failed: ${scenario.name}`, error)
    }

    const duration = Date.now() - startTime

    // Run assertions
    const failures: ScenarioResult['failures'] = []
    if (!config?.skipAssertions && scenario.assertions) {
      for (const assertion of scenario.assertions) {
        try {
          const passed = await this.runAssertion(assertion, execution, workflowOutput)
          if (!passed.success) {
            failures.push({
              assertion,
              expected: passed.expected,
              actual: passed.actual,
              message: passed.message
            })
          }
        } catch (error) {
          failures.push({
            assertion,
            expected: 'No error',
            actual: error,
            message: `Assertion execution failed: ${error}`
          })
        }
      }
    }

    const result: ScenarioResult = {
      scenario,
      execution,
      success: failures.length === 0 && !workflowError,
      failures,
      duration,
      error: workflowError
    }

    this.results.set(scenarioId, result)

    console.log(`🎭${result.success ? '✅' : '❌'} Scenario ${result.success ? 'passed' : 'failed'}: ${scenario.name}`, {
      duration: `${duration}ms`,
      failures: failures.length,
      error: workflowError?.message
    })

    return result
  }

  async runMultipleScenarios(
    scenarioIds: string[],
    workflowFunction: () => Promise<any>,
    config?: ScenarioRunConfig & { parallel?: boolean }
  ): Promise<ScenarioResult[]> {
    console.log(`🎭🎬 Running ${scenarioIds.length} scenarios${config?.parallel ? ' in parallel' : ' sequentially'}`)

    if (config?.parallel) {
      const promises = scenarioIds.map(id => this.runScenario(id, workflowFunction, config))
      return Promise.all(promises)
    } else {
      const results: ScenarioResult[] = []
      for (const scenarioId of scenarioIds) {
        const result = await this.runScenario(scenarioId, workflowFunction, config)
        results.push(result)

        if (!result.success && !config?.continueOnFailure) {
          console.log(`🎭⏹️ Stopping scenario execution due to failure: ${result.scenario.name}`)
          break
        }
      }
      return results
    }
  }

  // Scenario setup
  private async setupScenario(scenario: TestScenario): Promise<void> {
    // Switch to test mode if not already
    if (!databaseManager.isInTestMode()) {
      await databaseManager.switchMode('test')
    }

    // Restore initial database state
    if (scenario.initial_database_state) {
      await databaseManager.restoreSnapshot(scenario.initial_database_state)
      console.log(`🎭💾 Restored database snapshot: ${scenario.initial_database_state}`)
    } else {
      await databaseManager.resetToCleanState()
      console.log(`🎭🧹 Reset to clean database state`)
    }

    // Pre-populate LLM cache with expected responses
    if (scenario.expected_llm_responses) {
      await llmCache.prePopulate(scenario.workflow_name, scenario.expected_llm_responses)
      console.log(`🎭🧠 Pre-populated LLM cache with ${Object.keys(scenario.expected_llm_responses).length} responses`)
    }
  }

  // Assertion execution
  private async runAssertion(
    assertion: TestAssertion,
    execution: WorkflowExecution | null,
    workflowOutput: any
  ): Promise<{ success: boolean; expected: any; actual: any; message: string }> {
    switch (assertion.type) {
      case 'output_contains':
        return this.assertOutputContains(assertion, workflowOutput)

      case 'database_state':
        return this.assertDatabaseState(assertion)

      case 'llm_call_made':
        return this.assertLLMCallMade(assertion, execution)

      case 'duration_under':
        return this.assertDurationUnder(assertion, execution)

      case 'custom':
        return this.assertCustom(assertion, execution, workflowOutput)

      default:
        return {
          success: false,
          expected: 'Valid assertion type',
          actual: assertion.type,
          message: `Unknown assertion type: ${assertion.type}`
        }
    }
  }

  private assertOutputContains(
    assertion: TestAssertion,
    workflowOutput: any
  ): { success: boolean; expected: any; actual: any; message: string } {
    const outputString = JSON.stringify(workflowOutput)
    const contains = outputString.includes(assertion.condition)

    return {
      success: contains,
      expected: `Output containing "${assertion.condition}"`,
      actual: outputString.substring(0, 200) + '...',
      message: contains
        ? 'Output contains expected content'
        : `Output does not contain "${assertion.condition}"`
    }
  }

  private async assertDatabaseState(
    assertion: TestAssertion
  ): Promise<{ success: boolean; expected: any; actual: any; message: string }> {
    try {
      const { table, where, count } = assertion.condition

      const query = databaseManager.getClient().from(table).select('*', { count: 'exact' })

      if (where) {
        for (const [column, value] of Object.entries(where)) {
          query.eq(column, value)
        }
      }

      const { data, count: actualCount, error } = await query

      if (error) {
        return {
          success: false,
          expected: 'No database error',
          actual: error.message,
          message: `Database query failed: ${error.message}`
        }
      }

      if (count !== undefined) {
        const success = actualCount === count
        return {
          success,
          expected: count,
          actual: actualCount,
          message: success
            ? `Found expected ${count} rows in ${table}`
            : `Expected ${count} rows but found ${actualCount} in ${table}`
        }
      }

      return {
        success: true,
        expected: 'Query executed successfully',
        actual: data,
        message: `Database state assertion passed for table ${table}`
      }
    } catch (error) {
      return {
        success: false,
        expected: 'No error',
        actual: error,
        message: `Database assertion failed: ${error}`
      }
    }
  }

  private assertLLMCallMade(
    assertion: TestAssertion,
    execution: WorkflowExecution | null
  ): { success: boolean; expected: any; actual: any; message: string } {
    if (!execution) {
      return {
        success: false,
        expected: 'Workflow execution data',
        actual: null,
        message: 'No execution data available for LLM call assertion'
      }
    }

    const { provider, model, step_name } = assertion.condition
    const llmCalls = execution.llm_calls

    let matchingCalls = llmCalls
    if (provider) matchingCalls = matchingCalls.filter(call => call.provider === provider)
    if (model) matchingCalls = matchingCalls.filter(call => call.model === model)
    if (step_name) {
      const step = execution.steps.find(s => s.name === step_name)
      if (step) {
        matchingCalls = matchingCalls.filter(call => call.step_id === step.id)
      }
    }

    const success = matchingCalls.length > 0

    return {
      success,
      expected: `LLM call with ${JSON.stringify(assertion.condition)}`,
      actual: llmCalls.map(call => ({ provider: call.provider, model: call.model })),
      message: success
        ? `Found ${matchingCalls.length} matching LLM call(s)`
        : `No LLM calls found matching criteria`
    }
  }

  private assertDurationUnder(
    assertion: TestAssertion,
    execution: WorkflowExecution | null
  ): { success: boolean; expected: any; actual: any; message: string } {
    if (!execution || !execution.total_duration) {
      return {
        success: false,
        expected: 'Execution duration data',
        actual: null,
        message: 'No execution duration data available'
      }
    }

    const maxDuration = assertion.condition
    const actualDuration = execution.total_duration
    const success = actualDuration < maxDuration

    return {
      success,
      expected: `Duration under ${maxDuration}ms`,
      actual: `${actualDuration}ms`,
      message: success
        ? `Execution completed in ${actualDuration}ms (under ${maxDuration}ms limit)`
        : `Execution took ${actualDuration}ms (over ${maxDuration}ms limit)`
    }
  }

  private assertCustom(
    assertion: TestAssertion,
    execution: WorkflowExecution | null,
    workflowOutput: any
  ): { success: boolean; expected: any; actual: any; message: string } {
    try {
      // Custom assertions should be functions that return boolean
      const customFunction = assertion.condition
      if (typeof customFunction !== 'function') {
        return {
          success: false,
          expected: 'Function',
          actual: typeof customFunction,
          message: 'Custom assertion condition must be a function'
        }
      }

      const result = customFunction(execution, workflowOutput)
      const success = Boolean(result)

      return {
        success,
        expected: 'Custom assertion to pass',
        actual: result,
        message: success
          ? 'Custom assertion passed'
          : 'Custom assertion failed'
      }
    } catch (error) {
      return {
        success: false,
        expected: 'No error',
        actual: error,
        message: `Custom assertion threw error: ${error}`
      }
    }
  }

  // Utility methods
  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Workflow execution timed out after ${timeoutMs}ms`))
      }, timeoutMs)

      fn()
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  // Results and reporting
  getResult(scenarioId: string): ScenarioResult | undefined {
    return this.results.get(scenarioId)
  }

  getAllResults(): ScenarioResult[] {
    return Array.from(this.results.values())
  }

  getResultsByTag(tag: string): ScenarioResult[] {
    return Array.from(this.results.values())
      .filter(result => result.scenario.tags?.includes(tag))
  }

  generateReport(scenarioIds?: string[]): {
    summary: {
      total: number
      passed: number
      failed: number
      passRate: number
      totalDuration: number
    }
    results: ScenarioResult[]
  } {
    const results = scenarioIds
      ? scenarioIds.map(id => this.results.get(id)).filter(Boolean) as ScenarioResult[]
      : this.getAllResults()

    const passed = results.filter(r => r.success).length
    const failed = results.length - passed
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    return {
      summary: {
        total: results.length,
        passed,
        failed,
        passRate: results.length > 0 ? (passed / results.length) * 100 : 0,
        totalDuration
      },
      results
    }
  }

  // Import/Export scenarios
  exportScenarios(): Record<string, TestScenario> {
    const exported: Record<string, TestScenario> = {}
    for (const [id, scenario] of this.scenarios.entries()) {
      exported[id] = scenario
    }
    return exported
  }

  importScenarios(scenarios: Record<string, TestScenario>): void {
    for (const [id, scenario] of Object.entries(scenarios)) {
      this.scenarios.set(id, scenario)
    }
    console.log(`🎭📥 Imported ${Object.keys(scenarios).length} scenarios`)
  }

  async loadScenariosFromFile(filePath: string): Promise<void> {
    if (typeof window !== 'undefined') return

    try {
      const fs = await import('fs')
      const content = fs.readFileSync(filePath, 'utf-8')
      const scenarios = JSON.parse(content) as Record<string, TestScenario>
      this.importScenarios(scenarios)
    } catch (error) {
      console.error(`Failed to load scenarios from ${filePath}:`, error)
      throw error
    }
  }

  async saveScenarioToFile(scenarioId: string, filePath: string): Promise<void> {
    if (typeof window !== 'undefined') return

    const scenario = this.scenarios.get(scenarioId)
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    try {
      const fs = await import('fs')
      const path = await import('path')

      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      fs.writeFileSync(filePath, JSON.stringify(scenario, null, 2))
      console.log(`🎭💾 Saved scenario to ${filePath}`)
    } catch (error) {
      console.error(`Failed to save scenario to ${filePath}:`, error)
      throw error
    }
  }

  // Clear results
  clearResults(): void {
    this.results.clear()
    console.log('🎭🧹 Cleared all scenario results')
  }

  clearResult(scenarioId: string): void {
    this.results.delete(scenarioId)
    console.log(`🎭🧹 Cleared result for scenario: ${scenarioId}`)
  }
}

// Export singleton instance
export const scenarioManager = ScenarioManager.getInstance()

// Export convenience functions
export function createScenario(scenario: Omit<TestScenario, 'id'>): TestScenario {
  const fullScenario: TestScenario = {
    id: uuidv4(),
    ...scenario
  }
  scenarioManager.addScenario(fullScenario)
  return fullScenario
}

export function runScenario(
  scenarioId: string,
  workflowFunction: () => Promise<any>,
  config?: ScenarioRunConfig
): Promise<ScenarioResult> {
  return scenarioManager.runScenario(scenarioId, workflowFunction, config)
}

export function runAllScenarios(
  workflowFunction: () => Promise<any>,
  config?: ScenarioRunConfig & { parallel?: boolean }
): Promise<ScenarioResult[]> {
  const allScenarioIds = scenarioManager.listScenarios().map(s => s.id)
  return scenarioManager.runMultipleScenarios(allScenarioIds, workflowFunction, config)
}

export { ScenarioManager }