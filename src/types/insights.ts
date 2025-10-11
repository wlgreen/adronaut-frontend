/**
 * Shared type definitions for LLM-generated insights
 */

export interface Insight {
  insight: string
  hypothesis: string
  proposed_action: string
  primary_lever: 'audience' | 'creative' | 'budget' | 'bidding' | 'funnel'
  expected_effect: {
    direction: 'increase' | 'decrease'
    metric: string
    magnitude: 'small' | 'medium' | 'large'
    range?: string  // e.g., "15-25% improvement in blended portfolio ROAS (from ~4.5 to 5.2-5.6)"
  }
  confidence: number
  data_support: 'strong' | 'moderate' | 'weak'
  evidence_refs: string[]
  contrastive_reason: string
  impact_rank: number
  impact_score: number
}

export interface ExperimentDetails {
  objective: string
  hypothesis?: string  // e.g., "Younger segments (18-25) will show higher CTR..."
  method?: string      // e.g., "Audience segmentation A/B test"
  duration: string | Record<string, string>
  total_budget: string
  success_metrics: string[]
  decision_criteria: string
}

export interface AIRecommendations {
  rationale: string
  learning_value: string
  next_steps_after_experiment: string[]
}

/**
 * Validation flag types for patch annotations
 */

// Heuristic flags are simple strings
export type HeuristicFlag = string

// Sanity flags are structured objects from LLM reflection
export interface SanityFlag {
  action_id: string
  reason: string
  risk: 'high' | 'medium' | 'low'
  recommendation: string
}

/**
 * Schema detection types for adaptive data processing
 */

export interface DataSchema {
  primary_dimension: string
  row_count: number
  available_metrics: {
    efficiency: string[]
    cost: string[]
    volume: string[]
    comparative?: string[]
  }
}

export interface MetricStat {
  mean?: number
  median?: number
  min?: number
  max?: number
  sum?: number
  count?: number
}

export interface MetricsSummary {
  efficiency_metrics?: Record<string, MetricStat>
  cost_metrics?: Record<string, MetricStat>
  volume_metrics?: Record<string, MetricStat>
  comparative_metrics?: Record<string, MetricStat>
}
