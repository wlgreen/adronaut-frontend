/**
 * Integration Examples - How to use the debugging system with your existing workflow code
 */

import {
  executeWorkflow,
  createTestSession,
  runTestSuite,
  workflowExecutor,
  llmCache,
  databaseManager,
  QuickSetup
} from '../index'

// Example 1: Basic workflow wrapping
export async function exampleBasicIntegration() {
  console.log('🔍 Example: Basic Workflow Integration')

  // Your existing workflow function
  async function myMarketingWorkflow() {
    // Step 1: File analysis
    const analysisResult = await workflowExecutor.executeStep(
      'analyze_uploaded_files',
      'llm_call',
      async () => {
        // Your existing LLM call wrapped for caching and debugging
        return await workflowExecutor.executeLLMCall(
          'extract_features',
          'Analyze these files and extract marketing features...',
          async () => {
            // Your actual LLM API call
            return { target_audience: 'Young professionals', channels: ['social', 'email'] }
          },
          { provider: 'gemini', model: 'gemini-pro' }
        )
      }
    )

    // Step 2: Database operation
    const saveResult = await workflowExecutor.executeStep(
      'save_analysis',
      'database_operation',
      async () => {
        return await workflowExecutor.executeDatabaseOperation(
          'save_analysis',
          'insert',
          'analysis_snapshots',
          'INSERT INTO analysis_snapshots...',
          async () => {
            // Your actual database call
            return { id: 'snapshot_123', data: analysisResult }
          }
        )
      }
    )

    return { analysis: analysisResult, saved: saveResult }
  }

  // Execute with debugging
  const result = await executeWorkflow(myMarketingWorkflow, {
    name: 'marketing_analysis_workflow',
    enableDebug: true,
    enableCache: true,
    useTestDb: true
  })

  console.log('Workflow result:', result.result)
  console.log('Performance:', result.performance)
  console.log('Execution ID:', result.execution?.id)

  return result
}

// Example 2: Test scenario execution
export async function exampleTestExecution() {
  console.log('🧪 Example: Automated Test Execution')

  // Setup test environment
  await QuickSetup.testing()

  // Your workflow function
  async function testableWorkflow() {
    // This will use cached responses from the scenario
    const features = await workflowExecutor.executeLLMCall(
      'extract_features',
      'Extract marketing features from uploaded data',
      async () => {
        // This won't actually be called if cache hit
        throw new Error('Should use cached response!')
      }
    )

    return features
  }

  // Run all test scenarios
  const report = await runTestSuite(testableWorkflow, {
    scenarios: ['happy-path', 'llm-error'],
    parallel: false,
    timeout: 10000
  })

  console.log('Test results:', report)
  return report
}

// Example 3: Performance comparison
export async function examplePerformanceComparison() {
  console.log('📊 Example: Performance Comparison')

  async function workflowToTest() {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100))

    const result = await workflowExecutor.executeLLMCall(
      'test_call',
      'Test prompt',
      async () => ({ result: 'test response' })
    )

    return result
  }

  // Run without cache (first time)
  llmCache.clear()
  const result1 = await executeWorkflow(workflowToTest, {
    name: 'performance_test_nocache'
  })

  // Run with cache (second time)
  const result2 = await executeWorkflow(workflowToTest, {
    name: 'performance_test_cached'
  })

  // Compare executions
  if (result1.execution && result2.execution) {
    const comparison = await workflowExecutor.compareExecutions(
      result1.execution.id,
      result2.execution.id
    )

    console.log('Performance improvement:', {
      timeSaved: comparison.summary.performanceDelta,
      cacheHitRate: llmCache.getStats().hitRate,
      differences: comparison.summary.totalDifferences
    })
  }

  return { result1, result2 }
}

// Example 4: Breakpoint debugging
export async function exampleBreakpointDebugging() {
  console.log('🔍 Example: Breakpoint Debugging')

  async function debuggableWorkflow() {
    const step1 = await workflowExecutor.executeStep(
      'data_processing',
      'tool_execution',
      async () => {
        return { processed: true, count: 42 }
      }
    )

    const step2 = await workflowExecutor.executeStep(
      'analysis',
      'llm_call',
      async () => {
        return { insights: ['insight1', 'insight2'] }
      }
    )

    return { step1, step2 }
  }

  // Execute with breakpoints
  const result = await workflowExecutor.executeWithBreakpoints(
    debuggableWorkflow,
    {
      name: 'breakpoint_test',
      breakpoints: ['analysis'] // Will pause at 'analysis' step
    },
    async (context) => {
      console.log(`🛑 Breakpoint hit: ${context.stepName}`)
      console.log('Input:', context.input)
      console.log('Execution so far:', context.execution.steps.length, 'steps')

      // Could modify input here
      // context.canModifyInput({ modified: true })

      // Continue execution
      await context.canContinue()
    }
  )

  return result
}

// Example 5: Replay and modification
export async function exampleReplayWorkflow() {
  console.log('🔄 Example: Workflow Replay')

  // Get a previous execution ID (from your debugging session)
  const executions = workflowExecutor.getExecutionHistory()
  const lastExecution = executions[executions.length - 1]

  if (!lastExecution) {
    console.log('No previous executions to replay')
    return
  }

  async function replayableWorkflow() {
    // Same workflow logic as before
    return await workflowExecutor.executeLLMCall(
      'extract_features',
      'Extract features...',
      async () => ({ features: 'extracted' })
    )
  }

  // Replay with modifications
  const replayResult = await workflowExecutor.replay(replayableWorkflow, {
    workflow_execution_id: lastExecution.id,
    use_cache: true,
    target_environment: 'test',
    override_data: {
      'cache_marketing_workflow_extract_features': { modified: 'response' }
    }
  })

  console.log('Replay result:', replayResult)
  return replayResult
}

// Example 6: Integration with existing hook
export function exampleHookIntegration() {
  console.log('🔗 Example: Hook Integration')

  // Modify your existing useLLMData hook
  function useDebuggedLLMData(projectId?: string) {
    // Your existing hook logic, but wrapped with debugging

    const analyzeFiles = async () => {
      return await executeWorkflow(
        async () => {
          // Your existing analyzeFiles logic here
          const snapshot = await workflowExecutor.executeLLMCall(
            'analyze_files',
            `Analyze files for project ${projectId}`,
            async () => {
              // Your actual LLM service call
              return { analysis: 'results' }
            }
          )

          // Save to database
          await workflowExecutor.executeDatabaseOperation(
            'save_snapshot',
            'insert',
            'analysis_snapshots',
            'INSERT INTO...',
            async () => {
              // Your actual database save
              return { saved: true }
            }
          )

          return snapshot
        },
        {
          name: 'user_file_analysis',
          enableDebug: true,
          enableCache: true
        }
      )
    }

    return { analyzeFiles }
  }

  return useDebuggedLLMData
}

// Example 7: Complete test setup
export async function exampleCompleteTestSetup() {
  console.log('🏗️ Example: Complete Test Setup')

  // 1. Setup test environment
  const snapshotId = await createTestSession('comprehensive_test', [
    'happy-path',
    'approval-needed',
    'llm-error'
  ])

  // 2. Create some test data
  await databaseManager.getClient()
    .from('projects')
    .insert({ id: 'test-project', name: 'Test Project' })

  // 3. Create another snapshot with test data
  const dataSnapshotId = await databaseManager.createSnapshot(
    'with_test_data',
    'Snapshot with initial test data'
  )

  // 4. Run comprehensive tests
  const testResults = await runTestSuite(
    async () => {
      // Your full workflow implementation
      return { success: true, results: 'test completed' }
    },
    {
      scenarios: ['happy-path', 'approval-needed'],
      parallel: true,
      timeout: 15000,
      continueOnFailure: true
    }
  )

  // 5. Generate performance report
  const executionIds = testResults.results.map(r => r.execution?.id).filter(Boolean) as string[]
  const perfReport = workflowExecutor.getExecutionHistory()
    .slice(-5) // Last 5 executions
    .map(e => e.id)

  console.log('✅ Test setup complete:', {
    initialSnapshot: snapshotId,
    dataSnapshot: dataSnapshotId,
    testResults: testResults.summary,
    executionsAnalyzed: perfReport.length
  })

  return {
    snapshots: [snapshotId, dataSnapshotId],
    testResults,
    performanceData: perfReport
  }
}

// Export all examples for easy testing
export const examples = {
  basicIntegration: exampleBasicIntegration,
  testExecution: exampleTestExecution,
  performanceComparison: examplePerformanceComparison,
  breakpointDebugging: exampleBreakpointDebugging,
  replayWorkflow: exampleReplayWorkflow,
  hookIntegration: exampleHookIntegration,
  completeTestSetup: exampleCompleteTestSetup
}