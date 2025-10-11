'use client'

import { useState } from 'react'
import { CheckCircle, Brain, AlertCircle, Code, DollarSign, Lightbulb, Beaker, Flag, Users, Edit3, XCircle } from 'lucide-react'
import { PremiumCard } from '@/components/ui/PremiumCard'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { Badge } from '@/components/ui/Badge'
import { ExperimentHighlight } from './ExperimentHighlight'
import type { Insight, HeuristicFlag, SanityFlag } from '@/types/insights'

interface PatchCardProps {
  patch: {
    patch_id: string
    source: 'insights' | 'performance' | 'manual' | 'edited_llm'
    status: 'proposed' | 'approved' | 'rejected' | 'superseded'
    patch_json: Record<string, unknown>
    justification: string
    created_at: string
    annotations?: {
      heuristic_flags?: HeuristicFlag[]  // Simple strings from heuristic filters
      sanity_flags?: SanityFlag[]        // Structured objects from LLM reflection
      sanity_review?: 'safe' | 'review_recommended' | 'high_risk'
    }
  }
  onAction: (patchId: string, action: 'approve' | 'reject' | 'edit', editRequest?: string) => void
}

export function PatchCard({ patch, onAction }: PatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'insights': return <Brain className="w-5 h-5" />
      case 'performance': return <AlertCircle className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'insights': return 'info'
      case 'performance': return 'warning'
      case 'manual': return 'success'
      default: return 'default'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'insights': return 'Insights Agent'
      case 'performance': return 'Performance Analyzer'
      case 'manual': return 'Human Edited'
      case 'edited_llm': return 'LLM Edited'
      default: return 'Unknown'
    }
  }

  // Parse insights from justification if it's JSON
  const parseInsights = (): Insight[] => {
    try {
      const parsed = JSON.parse(patch.justification)
      if (parsed.insights && Array.isArray(parsed.insights)) {
        return parsed.insights
      }
    } catch {
      // Not JSON, return empty
    }
    return []
  }

  const insights = parseInsights()
  const strategyType = patch.patch_json.strategy_type || 'optimization'
  const experimentDetails = patch.patch_json.experiment_details
  const aiRecommendations = patch.patch_json.ai_recommendations

  const renderPatchChanges = () => {
    const changes = []

    if (patch.patch_json.audience_targeting) {
      changes.push(
        <div key="audience" className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm font-medium text-white">Audience Targeting</span>
          </div>
          <div className="ml-6 space-y-1">
            {patch.patch_json.audience_targeting.segments?.map((segment: { name: string; budget_allocation: string }, idx: number) => (
              <div key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                <span>{segment.name}: {segment.budget_allocation} allocation</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (patch.patch_json.budget_allocation) {
      changes.push(
        <div key="budget" className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-neon-emerald" />
            <span className="text-sm font-medium text-white">Budget Allocation</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="text-sm text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-emerald" />
              <span>Total Budget: {patch.patch_json.budget_allocation.total_budget}</span>
            </div>
            {patch.patch_json.budget_allocation.channel_breakdown && (
              Object.entries(patch.patch_json.budget_allocation.channel_breakdown).map(([channel, amount]) => (
                <div key={channel} className="text-sm text-gray-400 ml-4">
                  {channel}: {amount as string}
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    if (patch.patch_json.messaging_strategy) {
      changes.push(
        <div key="messaging" className="space-y-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-neon-amber" />
            <span className="text-sm font-medium text-white">Messaging Strategy</span>
          </div>
          <div className="ml-6 text-sm text-gray-300">
            {patch.patch_json.messaging_strategy.primary_message}
          </div>
        </div>
      )
    }

    return changes
  }

  return (
    <PremiumCard variant="elevated" className="overflow-hidden">
      <div className="p-6 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-500 to-neon-cyan flex items-center justify-center">
              {getSourceIcon(patch.source)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Strategy Patch Proposed
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getSourceColor(patch.source) as any} glow>
                  {getSourceLabel(patch.source)}
                </Badge>
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(patch.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PremiumButton
              variant="success"
              size="sm"
              onClick={() => onAction(patch.patch_id, 'approve')}
              className="animate-pulse-glow"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </PremiumButton>
            <PremiumButton
              variant="danger"
              size="sm"
              onClick={() => onAction(patch.patch_id, 'reject')}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </PremiumButton>
            <PremiumButton
              variant="secondary"
              size="sm"
              onClick={() => onAction(patch.patch_id, 'edit')}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </PremiumButton>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Strategy Type Badge */}
        {strategyType === 'experimental' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-3">
            <Beaker className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-sm font-medium text-blue-400">Experimental Strategy</div>
              <div className="text-xs text-gray-400 mt-0.5">
                This patch proposes structured experiments to gather data for future optimization
              </div>
            </div>
          </div>
        )}

        {/* Validation Flags */}
        {(patch.annotations?.heuristic_flags?.length || patch.annotations?.sanity_flags?.length) && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Flag className="w-4 h-4 text-gray-400" />
              Validation Notes
            </div>
            {patch.annotations.heuristic_flags && patch.annotations.heuristic_flags.length > 0 && (
              <div className="ml-6 space-y-1">
                <div className="text-xs text-gray-500 uppercase">Heuristic Checks</div>
                {patch.annotations.heuristic_flags.map((flag: HeuristicFlag, idx: number) => (
                  <div key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            )}
            {patch.annotations.sanity_flags && patch.annotations.sanity_flags.length > 0 && (
              <div className="ml-6 space-y-1">
                <div className="text-xs text-gray-500 uppercase">Sanity Review</div>
                {patch.annotations.sanity_flags.map((flag: SanityFlag, idx: number) => (
                  <div key={idx} className="text-xs flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                      flag.risk === 'high' ? 'bg-red-500' :
                      flag.risk === 'medium' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <div className={
                        flag.risk === 'high' ? 'text-red-400' :
                        flag.risk === 'medium' ? 'text-yellow-400' :
                        'text-gray-400'
                      }>{flag.reason}</div>
                      {flag.recommendation && (
                        <div className="text-gray-500 text-xs">→ {flag.recommendation}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {patch.annotations.sanity_review && (
              <div className="ml-6 mt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  patch.annotations.sanity_review === 'safe' ? 'bg-gray-700 text-gray-300' :
                  patch.annotations.sanity_review === 'high_risk' ? 'bg-red-900/30 text-red-400' :
                  'bg-yellow-900/30 text-yellow-400'
                }`}>
                  Review: {patch.annotations.sanity_review}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Insights Section */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-400" />
              Supporting Insights
            </h4>
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">#{insight.impact_rank}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">
                        {insight.impact_score}/100
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {insight.data_support === 'weak' ? 'Limited data' : insight.data_support}
                    </div>
                  </div>
                  <div className="text-sm text-gray-200">
                    <ExperimentHighlight text={insight.proposed_action} />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-400">
                      Expected: {insight.expected_effect.direction === 'increase' ? '↑' : '↓'} {insight.expected_effect.metric} ({insight.expected_effect.magnitude})
                    </div>
                    {insight.expected_effect.range && (
                      <div className="text-xs text-blue-300 ml-16">
                        {typeof insight.expected_effect.range === 'string'
                          ? insight.expected_effect.range
                          : JSON.stringify(insight.expected_effect.range)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Justification (fallback if not JSON) */}
        {insights.length === 0 && (
          <div>
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-electric-500" />
              AI Justification
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {patch.justification}
            </p>
          </div>
        )}

        {/* Experiment Details */}
        {experimentDetails && (
          <div className="space-y-3 bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Beaker className="w-4 h-4 text-blue-400" />
              Experiment Design
            </h4>
            <div className="space-y-2 text-sm">
              {experimentDetails.objective && (
                <div>
                  <span className="text-gray-400">Objective: </span>
                  <span className="text-gray-200">{experimentDetails.objective}</span>
                </div>
              )}
              {experimentDetails.hypothesis && (
                <div>
                  <span className="text-gray-400">Hypothesis: </span>
                  <span className="text-gray-200">{experimentDetails.hypothesis}</span>
                </div>
              )}
              {experimentDetails.method && (
                <div>
                  <span className="text-gray-400">Method: </span>
                  <span className="text-gray-200">{experimentDetails.method}</span>
                </div>
              )}
              {experimentDetails.duration && (
                <div>
                  <span className="text-gray-400">Duration: </span>
                  <span className="text-gray-200">{experimentDetails.duration}</span>
                </div>
              )}
              {experimentDetails.total_budget && (
                <div>
                  <span className="text-gray-400">Budget: </span>
                  <span className="text-gray-200">{experimentDetails.total_budget}</span>
                </div>
              )}
              {experimentDetails.success_metrics && experimentDetails.success_metrics.length > 0 && (
                <div>
                  <span className="text-gray-400">Success Metrics:</span>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    {experimentDetails.success_metrics.map((metric: any, idx: number) => (
                      <li key={idx} className="text-gray-300">
                        {typeof metric === 'string'
                          ? metric
                          : metric.metric
                            ? `${metric.metric}${metric.target ? ` (target: ${metric.target})` : ''}${metric.baseline ? ` (baseline: ${metric.baseline})` : ''}`
                            : JSON.stringify(metric)
                        }
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {experimentDetails.decision_criteria && (
                <div>
                  <span className="text-gray-400">Decision Criteria: </span>
                  <span className="text-gray-200">{experimentDetails.decision_criteria}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {aiRecommendations && (
          <div className="space-y-3 bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-400" />
              AI Recommendations
            </h4>
            <div className="space-y-2 text-sm">
              {aiRecommendations.rationale && (
                <div>
                  <span className="text-gray-400">Rationale: </span>
                  <span className="text-gray-200">{aiRecommendations.rationale}</span>
                </div>
              )}
              {aiRecommendations.learning_value && (
                <div>
                  <span className="text-gray-400">Learning Value: </span>
                  <span className="text-gray-200">{aiRecommendations.learning_value}</span>
                </div>
              )}
              {aiRecommendations.next_steps_after_experiment && aiRecommendations.next_steps_after_experiment.length > 0 && (
                <div>
                  <span className="text-gray-400">Next Steps After Experiment:</span>
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    {aiRecommendations.next_steps_after_experiment.map((step: string, idx: number) => (
                      <li key={idx} className="text-gray-300">{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Proposed Changes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-neon-cyan" />
              Proposed Changes
            </h4>
            <PremiumButton
              variant="secondary"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </PremiumButton>
          </div>

          {isExpanded ? (
            <div className="space-y-4">
              {renderPatchChanges()}
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Click &quot;Show Details&quot; to view complete patch diff
            </div>
          )}
        </div>

        {/* Expected Impact - Use real data from insights if available */}
        {insights.length > 0 && (
          <div className="border-t border-space-300 pt-4">
            <h4 className="text-sm font-medium text-white mb-2">Expected Impact</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              {insights.slice(0, 3).map((insight, idx) => (
                <div key={idx}>
                  <p className="text-lg font-mono font-bold text-neon-cyan">
                    {insight.expected_effect.direction === 'increase' ? '↑' : '↓'}
                  </p>
                  <p className="text-xs text-gray-400">{insight.expected_effect.metric}</p>
                  <p className="text-xs text-gray-500 mt-1">{insight.expected_effect.magnitude}</p>
                  {insight.expected_effect.range && (
                    <p className="text-xs text-blue-300 mt-1">
                      {typeof insight.expected_effect.range === 'string'
                        ? insight.expected_effect.range
                        : JSON.stringify(insight.expected_effect.range)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PremiumCard>
  )
}