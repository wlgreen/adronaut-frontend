/**
 * Core debugging types for automated workflow debugging system
 */

export interface WorkflowStep {
  id: string
  name: string
  type: 'llm_call' | 'database_operation' | 'api_call' | 'decision_point' | 'tool_execution' | 'user_interaction'
  timestamp: string
  duration?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input?: any
  output?: any
  error?: {
    message: string
    stack?: string
    code?: string
  }
  metadata?: {
    correlation_id?: string
    parent_step_id?: string
    workflow_name?: string
    component?: 'frontend' | 'backend'
    [key: string]: any
  }
}

export interface LLMCallData {
  id: string
  step_id: string
  provider: 'gemini' | 'openai' | 'claude'
  model: string
  prompt: string
  response: string
  tokens_used?: {
    input: number
    output: number
    total: number
  }
  cost?: number
  latency: number
  timestamp: string
  cache_hit?: boolean
  cache_key?: string
}

export interface DatabaseOperation {
  id: string
  step_id: string
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  table: string
  query: string
  parameters?: any
  result?: any
  rows_affected?: number
  execution_time: number
  timestamp: string
  error?: string
}

export interface WorkflowExecution {
  id: string
  name: string
  correlation_id: string
  start_time: string
  end_time?: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  trigger: 'user' | 'api' | 'scheduled' | 'test'
  steps: WorkflowStep[]
  llm_calls: LLMCallData[]
  database_operations: DatabaseOperation[]
  total_duration?: number
  total_cost?: number
  environment: 'development' | 'test' | 'production'
  snapshot_id?: string
  parent_execution_id?: string // for replays
}

export interface DatabaseSnapshot {
  id: string
  name: string
  created_at: string
  tables: Record<string, any[]>
  metadata: {
    total_size: number
    table_count: number
    row_count: number
    description?: string
  }
}

export interface TestScenario {
  id: string
  name: string
  description: string
  workflow_name: string
  initial_database_state?: string // snapshot ID
  expected_llm_responses?: Record<string, any>
  breakpoints?: string[] // step names to pause at
  assertions?: TestAssertion[]
  expected_final_state?: {
    database?: Record<string, any>
    workflow_status?: string
    output?: any
  }
  tags?: string[]
}

export interface TestAssertion {
  id: string
  step_name: string
  type: 'output_contains' | 'database_state' | 'llm_call_made' | 'duration_under' | 'custom'
  condition: any
  description: string
}

export interface CacheEntry {
  key: string
  workflow_name: string
  step_name: string
  prompt_hash: string
  response: any
  created_at: string
  hits: number
  last_used: string
  metadata?: {
    model?: string
    tokens?: number
    original_latency?: number
  }
}

export interface DebugSession {
  id: string
  name: string
  created_at: string
  executions: WorkflowExecution[]
  snapshots_used: string[]
  cache_stats: {
    hits: number
    misses: number
    hit_rate: number
  }
  total_executions: number
  total_duration: number
  environment: 'development' | 'test'
}

export interface WorkflowDebugConfig {
  enabled: boolean
  mode: 'development' | 'test' | 'production'
  database: {
    use_test_db: boolean
    test_db_url?: string
    auto_snapshot: boolean
    snapshot_frequency: number
  }
  llm_cache: {
    enabled: boolean
    directory: string
    versioning: boolean
    auto_generate: boolean
  }
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    include_stacks: boolean
    max_payload_size: number
  }
  performance: {
    track_all_calls: boolean
    slow_query_threshold: number
    slow_llm_threshold: number
  }
}

// Event types for real-time debugging
export interface DebugEvent {
  type: 'step_started' | 'step_completed' | 'step_failed' | 'llm_call' | 'db_operation' | 'error' | 'workflow_paused'
  workflow_id: string
  step_id?: string
  data: any
  timestamp: string
}

// Replay configuration
export interface ReplayConfig {
  workflow_execution_id: string
  start_from_step?: string
  override_data?: Record<string, any>
  use_cache: boolean
  target_environment: 'test' | 'development'
  snapshot_id?: string
}

// Performance metrics
export interface PerformanceMetrics {
  workflow_id: string
  total_duration: number
  step_durations: Record<string, number>
  llm_call_durations: Record<string, number>
  database_operation_durations: Record<string, number>
  bottlenecks: Array<{
    type: 'step' | 'llm' | 'database'
    identifier: string
    duration: number
    percentage_of_total: number
  }>
  cost_breakdown: {
    llm_calls: number
    database_operations: number
    total: number
  }
}

// Comparison types for analyzing differences between runs
export interface WorkflowComparison {
  execution_a: string
  execution_b: string
  differences: {
    steps: Array<{
      step_name: string
      difference_type: 'missing' | 'different_output' | 'different_duration' | 'different_status'
      details: any
    }>
    llm_calls: Array<{
      call_id: string
      difference_type: 'different_prompt' | 'different_response' | 'different_latency'
      details: any
    }>
    database_operations: Array<{
      operation_id: string
      difference_type: 'different_query' | 'different_result' | 'different_timing'
      details: any
    }>
  }
  summary: {
    total_differences: number
    critical_differences: number
    performance_delta: number
  }
}