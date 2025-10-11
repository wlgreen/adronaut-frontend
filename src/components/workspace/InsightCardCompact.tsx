'use client';

import React, { useState } from 'react';
import type { Insight } from '@/types/insights';
import {
  getPriorityConfig,
  getLeverIcon,
  generateHeadline,
  formatExpectedImpact,
  extractWhyReason,
  extractActionSteps,
} from '@/lib/utils/insightFormatters';

interface InsightCardCompactProps {
  insight: Insight;
  rank: number;
  onReviewClick?: () => void;
}

/**
 * Compact, scannable insight card with headline-first design
 *
 * Design philosophy:
 * - Key message visible in <5 seconds
 * - Clear visual hierarchy (headline → impact → why → action)
 * - Details collapsed by default
 * - Positive framing ("Test & Learn" vs "LIMITED DATA")
 */
export const InsightCardCompact: React.FC<InsightCardCompactProps> = ({
  insight,
  rank,
  onReviewClick,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const priority = getPriorityConfig(insight);
  const leverInfo = getLeverIcon(insight.primary_lever);
  const headline = generateHeadline(insight);
  const impact = formatExpectedImpact(insight);
  const whyReason = extractWhyReason(insight);
  const { experiment, metrics } = extractActionSteps(insight);

  return (
    <div
      className={`rounded-xl border ${priority.borderColor} ${priority.bgGradient} p-6 space-y-4 transition-all hover:shadow-lg`}
      data-testid="insight-card-compact"
    >
      {/* Header: Rank + Priority Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold text-gray-600">#{rank}</div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${priority.borderColor} bg-gray-900/50`}>
            <span className="text-lg">{priority.emoji}</span>
            <span className={`text-sm font-semibold ${priority.textColor}`}>
              {priority.label}
            </span>
          </div>
        </div>

        {/* Lever indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-base">{leverInfo.icon}</span>
          <span className={`font-medium ${leverInfo.color}`}>
            {insight.primary_lever}
          </span>
        </div>
      </div>

      {/* Data Insight - What we observed */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-blue-300 uppercase tracking-wide font-medium">
          <span>📊</span>
          <span>Data Shows</span>
        </div>
        <div className="text-white leading-relaxed">{insight.insight}</div>
      </div>

      {/* Headline - The key action */}
      <div className="space-y-2">
        <div className="text-xs text-gray-400 uppercase tracking-wide">Recommended Action</div>
        <h3 className="text-xl font-bold text-white leading-tight">
          {leverInfo.icon} {headline}
        </h3>
      </div>

      {/* Expected Impact - What will happen */}
      <div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📈</span>
          <div className="flex-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Expected Impact</div>
            <div className="text-lg font-semibold text-emerald-300">
              {impact}
            </div>
            {insight.expected_effect.range && (
              <div className="text-sm text-gray-400 mt-1">
                {typeof insight.expected_effect.range === 'string'
                  ? insight.expected_effect.range
                  : JSON.stringify(insight.expected_effect.range)}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Confidence: {(insight.confidence * 100).toFixed(0)}% • {insight.data_support} data support
            </div>
          </div>
        </div>
      </div>

      {/* Why - The reasoning */}
      <div className="flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div className="flex-1">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Why This Works</div>
          <div className="text-gray-200 leading-relaxed">
            {whyReason}
          </div>
        </div>
      </div>

      {/* Action Steps - What to do */}
      {(experiment || metrics) && (
        <div className="flex items-start gap-3">
          <span className="text-xl">🎬</span>
          <div className="flex-1 space-y-2">
            <div className="text-xs text-gray-400 uppercase tracking-wide">Action Steps</div>
            {experiment && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Run:</span>
                <span className="text-white font-medium bg-gray-800 px-2 py-1 rounded">
                  {experiment}
                </span>
              </div>
            )}
            {metrics && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 whitespace-nowrap">Track:</span>
                <span className="text-gray-300">{metrics}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Details Section */}
      <div className="pt-2 border-t border-gray-700">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          <span>{showDetails ? 'Hide full analysis' : 'See full analysis'}</span>
          <span className="text-lg">{showDetails ? '▲' : '▼'}</span>
        </button>

        {showDetails && (
          <div className="mt-4 space-y-4 text-sm" data-testid="insight-details">
            {/* Full Hypothesis */}
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Full Hypothesis</div>
              <div className="text-gray-300 bg-gray-900/30 p-3 rounded border border-gray-700">
                {insight.hypothesis}
              </div>
            </div>

            {/* Full Proposed Action */}
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Complete Action Plan</div>
              <div className="text-gray-300 bg-gray-900/30 p-3 rounded border border-gray-700">
                {insight.proposed_action}
              </div>
            </div>

            {/* Evidence References */}
            {insight.evidence_refs && insight.evidence_refs.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Evidence Sources</div>
                <ul className="list-disc list-inside text-gray-400 space-y-1 bg-gray-900/30 p-3 rounded border border-gray-700">
                  {insight.evidence_refs.map((ref, i) => (
                    <li key={i} className="font-mono text-xs">
                      {ref.replace(/^features\./, '').replace(/\./g, ' → ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contrastive Reasoning */}
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Why This vs Alternatives</div>
              <div className="text-gray-300 italic bg-gray-900/30 p-3 rounded border border-gray-700">
                {insight.contrastive_reason}
              </div>
            </div>

            {/* Technical Metrics */}
            <div className="grid grid-cols-2 gap-4 bg-gray-900/30 p-3 rounded border border-gray-700">
              <div>
                <div className="text-xs text-gray-500">Impact Score</div>
                <div className="text-white font-semibold">{insight.impact_score}/100</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Confidence</div>
                <div className="text-white font-semibold">{(insight.confidence * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Data Support</div>
                <div className="text-white font-semibold capitalize">{insight.data_support}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Expected Change</div>
                <div className="text-white font-semibold capitalize">
                  {insight.expected_effect.direction} ({insight.expected_effect.magnitude})
                </div>
              </div>
            </div>

            {/* Test & Learn Callout */}
            {insight.data_support === 'weak' && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="text-sm font-semibold text-indigo-300 mb-1">
                      Data Collection Opportunity
                    </div>
                    <div className="text-xs text-gray-300 leading-relaxed">
                      This recommendation focuses on gathering data to validate the hypothesis and inform future decisions.
                      Track success metrics throughout the experiment period to build confidence.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightCardCompact;
