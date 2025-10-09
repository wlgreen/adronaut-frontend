'use client';

import React, { useState } from 'react';
import type { Insight } from '@/types/insights';

interface InsightsCardProps {
  insights: Insight[];
  onInsightClick?: (insight: Insight) => void;
}

const DataSupportIndicator: React.FC<{ support: 'strong' | 'moderate' | 'weak' }> = ({ support }) => {
  const label = support === 'weak' ? 'Limited data' : support === 'moderate' ? 'Moderate' : 'Strong';
  const dotColor = support === 'strong' ? 'bg-blue-500' : 'bg-gray-400';

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </div>
  );
};

const ImpactScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  // Use blue intensity gradient (not red/yellow/green)
  const bgColor = score >= 70 ? 'bg-blue-600' : score >= 50 ? 'bg-blue-500' : 'bg-blue-400';

  return (
    <div className={`${bgColor} text-white px-3 py-1 rounded-lg text-sm font-medium`}>
      {score}/100
    </div>
  );
};

const ExperimentHighlight: React.FC<{ text: string }> = ({ text }) => {
  const experimentKeywords = ['pilot', 'test', 'a/b', 'experiment', 'validate', 'trial', 'measure', 'track'];

  // Split text by experiment keywords and highlight them
  const parts: React.ReactNode[] = [];
  let remainingText = text;
  let index = 0;

  while (remainingText.length > 0) {
    let foundKeyword = false;

    for (const keyword of experimentKeywords) {
      const lowerText = remainingText.toLowerCase();
      const keywordIndex = lowerText.indexOf(keyword);

      if (keywordIndex !== -1) {
        // Add text before keyword
        if (keywordIndex > 0) {
          parts.push(
            <span key={`text-${index++}`}>
              {remainingText.substring(0, keywordIndex)}
            </span>
          );
        }

        // Add highlighted keyword
        parts.push(
          <span key={`keyword-${index++}`} className="bg-amber-500/20 text-amber-300 px-1 rounded">
            {remainingText.substring(keywordIndex, keywordIndex + keyword.length)}
          </span>
        );

        remainingText = remainingText.substring(keywordIndex + keyword.length);
        foundKeyword = true;
        break;
      }
    }

    if (!foundKeyword) {
      parts.push(<span key={`text-${index++}`}>{remainingText}</span>);
      break;
    }
  }

  return <>{parts}</>;
};

const InsightCard: React.FC<{ insight: Insight; rank: number }> = ({ insight, rank }) => {
  const [expanded, setExpanded] = useState(false);

  const leverColors: Record<string, string> = {
    audience: 'text-purple-400',
    creative: 'text-cyan-400',
    budget: 'text-green-400',
    bidding: 'text-orange-400',
    funnel: 'text-pink-400',
  };

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 space-y-3">
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

      {/* Proposed Action */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Proposed Action</div>
        <div className="text-gray-200">
          <ExperimentHighlight text={insight.proposed_action} />
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
            {insight.expected_effect.range}
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
        <div className="space-y-3 pt-2 border-t border-gray-700">
          {/* Evidence References */}
          {insight.evidence_refs && insight.evidence_refs.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Evidence References</div>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                {insight.evidence_refs.map((ref, i) => (
                  <li key={i} className="font-mono text-xs">{ref}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Contrastive Reason */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Why This vs Alternatives</div>
            <div className="text-sm text-gray-300 italic">{insight.contrastive_reason}</div>
          </div>
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
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 space-y-4">
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
