'use client';

import React, { useState } from 'react';
import type { Insight } from '@/types/insights';

interface InsightsCardProps {
  insights: Insight[];
  onInsightClick?: (insight: Insight) => void;
}

const DataSupportIndicator: React.FC<{ support: 'strong' | 'moderate' | 'weak' }> = ({ support }) => {
  const getBadgeStyle = () => {
    if (support === 'strong') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    if (support === 'weak') return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const label = support === 'weak' ? 'LIMITED DATA' : support === 'moderate' ? 'MODERATE DATA' : 'STRONG DATA';

  return (
    <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border ${getBadgeStyle()}`} data-testid="data-support-badge">
      <div className={`w-2 h-2 rounded-full ${support === 'strong' ? 'bg-emerald-500' : support === 'weak' ? 'bg-amber-500' : 'bg-gray-400'}`} />
      <span>{label}</span>
    </div>
  );
};

const ImpactScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const bgColor = score >= 70 ? 'bg-blue-600' : score >= 50 ? 'bg-blue-500' : 'bg-blue-400';

  return (
    <div className={`${bgColor} text-white px-3 py-1 rounded-lg text-sm font-medium`}>
      {score}/100
    </div>
  );
};

const InsightCard: React.FC<{ insight: Insight; rank: number }> = ({ insight, rank }) => {
  // Auto-expand weak insights to show experiment details
  const [expanded, setExpanded] = useState(insight.data_support === 'weak');

  const leverColors: Record<string, string> = {
    audience: 'text-purple-400',
    creative: 'text-cyan-400',
    budget: 'text-green-400',
    bidding: 'text-orange-400',
    funnel: 'text-pink-400',
  };

  // Determine border color based on data support
  const getBorderColor = () => {
    if (insight.data_support === 'strong') return 'border-emerald-500/50';
    if (insight.data_support === 'weak') return 'border-amber-500/50';
    return 'border-gray-700';
  };

  // Highlight experiment keywords in proposed action
  const highlightExperimentKeywords = (text: string) => {
    const keywords = ['pilot', 'test', 'a/b', 'experiment', 'validate', 'trial', 'measure', 'track', 'budget cap', 'days', 'day'];
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let index = 0;

    while (remaining.length > 0) {
      let foundKeyword = false;

      for (const keyword of keywords) {
        const lowerText = remaining.toLowerCase();
        const keywordIndex = lowerText.indexOf(keyword);

        if (keywordIndex !== -1) {
          // Add text before keyword
          if (keywordIndex > 0) {
            parts.push(
              <span key={`text-${index++}`}>
                {remaining.substring(0, keywordIndex)}
              </span>
            );
          }

          // Add highlighted keyword
          parts.push(
            <span key={`keyword-${index++}`} className="bg-amber-500/20 text-amber-300 px-1 rounded font-medium">
              {remaining.substring(keywordIndex, keywordIndex + keyword.length)}
            </span>
          );

          remaining = remaining.substring(keywordIndex + keyword.length);
          foundKeyword = true;
          break;
        }
      }

      if (!foundKeyword) {
        parts.push(<span key={`text-${index++}`}>{remaining}</span>);
        break;
      }
    }

    return <>{parts}</>;
  };

  return (
    <div className={`bg-gray-800/50 rounded-lg border ${getBorderColor()} p-4 space-y-3`} data-testid="insight-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-gray-500">#{rank}</div>
          <ImpactScoreBadge score={insight.impact_score} />
        </div>
        <DataSupportIndicator support={insight.data_support} />
      </div>

      {/* Primary Lever */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Primary lever:</span>
        <span className={`text-sm font-medium ${leverColors[insight.primary_lever]}`}>
          {insight.primary_lever}
        </span>
      </div>

      {/* Insight */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Insight</div>
        <div className="text-gray-200">{insight.insight}</div>
      </div>

      {/* Hypothesis */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Hypothesis</div>
        <div className="text-gray-300">{insight.hypothesis}</div>
      </div>

      {/* Proposed Action - Highlight experiment keywords for weak insights */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Proposed Action</div>
          {insight.data_support === 'weak' && (
            <div className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
              🧪 LEARNING EXPERIMENT
            </div>
          )}
        </div>
        <div className="text-gray-200">
          {insight.data_support === 'weak' ? (
            highlightExperimentKeywords(insight.proposed_action)
          ) : (
            insight.proposed_action
          )}
        </div>
      </div>

      {/* Expected Effect */}
      <div className="space-y-1">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Expected:</span>
          <span className="text-gray-200">
            {insight.expected_effect.direction === 'increase' ? '↑' : '↓'} {insight.expected_effect.metric}
          </span>
          <span className="text-gray-400">
            ({insight.expected_effect.magnitude} magnitude)
          </span>
          <span className="text-gray-400 ml-auto">
            Confidence: {(insight.confidence * 100).toFixed(0)}%
          </span>
        </div>
        {insight.expected_effect.range && (
          <div className="text-xs text-blue-300 ml-20">
            {typeof insight.expected_effect.range === 'string'
              ? insight.expected_effect.range
              : JSON.stringify(insight.expected_effect.range)}
          </div>
        )}
      </div>

      {/* Expandable Section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm text-blue-400 hover:text-blue-300 transition-colors pt-2 border-t border-gray-700"
      >
        <span>{expanded ? 'Hide details' : 'Show details'}</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="space-y-3 pt-2 border-t border-gray-700" data-testid="experiment-section">
          {/* Evidence References - Adaptive Parser */}
          {insight.evidence_refs && insight.evidence_refs.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Evidence References</div>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                {insight.evidence_refs.map((ref, i) => {
                  // Parse path: features.segment_performance.by_keyword.fanny_pack.metrics.roas
                  const parts = ref.split('.');

                  // Remove "features" prefix
                  const pathParts = parts.slice(1);

                  // Identify dimension values (contain underscores or numbers, not common keywords)
                  const commonKeywords = ['by', 'metrics', 'summary', 'performance', 'segment', 'campaigns'];

                  return (
                    <li key={i} className="font-mono text-xs flex items-start gap-1">
                      {pathParts.map((part, idx) => {
                        // Check if this part is likely a dimension value
                        const isDimensionValue =
                          /[_\d]/.test(part) &&
                          !commonKeywords.some(kw => part.toLowerCase().includes(kw));

                        const displayText = part.replace(/_/g, ' ');

                        return (
                          <span key={idx} className="inline-flex items-center">
                            <span className={isDimensionValue ? 'text-blue-300 font-semibold' : 'text-gray-400'}>
                              {displayText}
                            </span>
                            {idx < pathParts.length - 1 && (
                              <span className="text-gray-600 mx-1">→</span>
                            )}
                          </span>
                        );
                      })}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Contrastive Reason */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Why This vs Alternatives</div>
            <div className="text-sm text-gray-300 italic">{insight.contrastive_reason}</div>
          </div>

          {/* Weak Data Call-out */}
          {insight.data_support === 'weak' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="text-xs text-amber-300 font-medium mb-1">📊 DATA COLLECTION OPPORTUNITY</div>
              <div className="text-xs text-gray-300">
                This recommendation focuses on gathering data to make informed decisions in future cycles.
                Success metrics should be tracked throughout the experiment period.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const InsightsCard: React.FC<InsightsCardProps> = ({ insights, onInsightClick }) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 space-y-4" data-testid="insights-container">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Strategic Insights</h3>
        <div className="text-sm text-gray-400">{insights.length} insights</div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} rank={insight.impact_rank} />
        ))}
      </div>
    </div>
  );
};

export default InsightsCard;
