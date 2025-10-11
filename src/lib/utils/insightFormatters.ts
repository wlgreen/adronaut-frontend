/**
 * Utilities for formatting and simplifying insight data for display
 */

import type { Insight } from '@/types/insights';

/**
 * Priority levels based on impact score and data support
 */
export type PriorityLevel = 'high' | 'medium' | 'test-and-learn';

export interface PriorityConfig {
  label: string;
  emoji: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
}

/**
 * Get priority level configuration
 */
export function getPriorityConfig(insight: Insight): PriorityConfig {
  // Test & Learn: Weak data support (regardless of score)
  if (insight.data_support === 'weak') {
    return {
      label: 'Test & Learn',
      emoji: '🧪',
      bgGradient: 'bg-gradient-to-br from-indigo-900/20 to-blue-900/20',
      borderColor: 'border-indigo-500/50',
      textColor: 'text-indigo-300',
    };
  }

  // High Priority: Score >= 70
  if (insight.impact_score >= 70) {
    return {
      label: 'High Priority',
      emoji: '⚡',
      bgGradient: 'bg-gradient-to-br from-blue-900/30 to-purple-900/30',
      borderColor: 'border-blue-500/50',
      textColor: 'text-blue-300',
    };
  }

  // Medium Priority: Score 50-69
  return {
    label: 'Medium Priority',
    emoji: '🎯',
    bgGradient: 'bg-gradient-to-br from-cyan-900/20 to-teal-900/20',
    borderColor: 'border-cyan-500/50',
    textColor: 'text-cyan-300',
  };
}

/**
 * Get lever icon and color
 */
export function getLeverIcon(lever: string): { icon: string; color: string } {
  const leverMap: Record<string, { icon: string; color: string }> = {
    audience: { icon: '👥', color: 'text-purple-400' },
    creative: { icon: '🎨', color: 'text-cyan-400' },
    budget: { icon: '💰', color: 'text-green-400' },
    bidding: { icon: '📊', color: 'text-blue-400' },
    funnel: { icon: '🔄', color: 'text-pink-400' },
  };

  return leverMap[lever] || { icon: '🎯', color: 'text-gray-400' };
}

/**
 * Generate a clear, actionable headline from proposed_action
 *
 * Examples:
 * - "Run a 7-day pilot experiment..." → "Test Higher Bids for Row 17"
 * - "Increase budget allocation..." → "Increase Budget for High-ROAS Segments"
 * - "Target younger demographics..." → "Target Younger Audiences (18-25)"
 */
export function generateHeadline(insight: Insight): string {
  const action = insight.proposed_action.toLowerCase();
  const lever = insight.primary_lever;

  // Pattern 1: Test/Pilot/Experiment (most common for weak data)
  if (action.includes('pilot') || action.includes('test') || action.includes('experiment')) {
    // Extract what's being tested
    if (action.includes('bid') || lever === 'bidding') {
      const rowMatch = action.match(/row\s+['"]?(\d+|[a-z0-9_]+)['"]?/i);
      const segmentName = rowMatch ? rowMatch[1] : '';
      return `Test Higher Bids${segmentName ? ` for ${formatSegmentName(segmentName)}` : ''}`;
    }

    if (action.includes('audience') || lever === 'audience') {
      return 'Test New Audience Segments';
    }

    if (action.includes('creative') || lever === 'creative') {
      return 'Test New Creative Variants';
    }

    if (action.includes('budget') || lever === 'budget') {
      return 'Test Budget Reallocation';
    }

    return 'Run Pilot Experiment';
  }

  // Pattern 2: Increase/Boost/Raise
  if (action.includes('increase') || action.includes('boost') || action.includes('raise')) {
    if (lever === 'bidding') {
      return 'Increase Bids for Target Keywords';
    }
    if (lever === 'budget') {
      return 'Increase Budget for High Performers';
    }
    if (lever === 'audience') {
      return 'Expand Audience Reach';
    }
    return 'Increase Investment';
  }

  // Pattern 3: Decrease/Reduce/Lower
  if (action.includes('decrease') || action.includes('reduce') || action.includes('lower')) {
    if (lever === 'bidding') {
      return 'Reduce Bids on Low Performers';
    }
    if (lever === 'budget') {
      return 'Cut Budget on Inefficient Segments';
    }
    return 'Optimize Spend Efficiency';
  }

  // Pattern 4: Target/Focus
  if (action.includes('target') || action.includes('focus')) {
    if (lever === 'audience') {
      // Try to extract demographic info
      const ageMatch = action.match(/(\d{2})-(\d{2})/);
      if (ageMatch) {
        return `Target Younger Audiences (${ageMatch[0]})`;
      }
      return 'Focus on High-Value Audiences';
    }
    return 'Refine Targeting Strategy';
  }

  // Pattern 5: Shift/Reallocate
  if (action.includes('shift') || action.includes('reallocate') || action.includes('move')) {
    return 'Reallocate Budget to Winners';
  }

  // Pattern 6: Optimize
  if (action.includes('optimize')) {
    if (lever === 'creative') {
      return 'Optimize Creative Strategy';
    }
    if (lever === 'funnel') {
      return 'Optimize Conversion Funnel';
    }
    return 'Optimize Campaign Performance';
  }

  // Fallback: Use first sentence of proposed_action, truncated
  const firstSentence = insight.proposed_action.split(/[.!?]/)[0].trim();
  return firstSentence.length > 60 ? firstSentence.substring(0, 57) + '...' : firstSentence;
}

/**
 * Format segment names for display
 */
function formatSegmentName(name: string): string {
  // Handle row_17 → Row 17
  if (name.toLowerCase().startsWith('row')) {
    return name.replace(/row[\s_]*/i, 'Row ').trim();
  }

  // Handle snake_case → Title Case
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format expected effect into a concise, scannable string
 */
export function formatExpectedImpact(insight: Insight): string {
  const { direction, metric, magnitude, range } = insight.expected_effect;
  const arrow = direction === 'increase' ? '↑' : '↓';

  // If range is provided, use it
  if (range) {
    return `${arrow} ${range}`;
  }

  // Otherwise, construct generic message
  const magnitudeText = magnitude === 'large' ? '+20-40%' : magnitude === 'medium' ? '+10-20%' : '+5-10%';
  return `${arrow} ${magnitudeText} ${metric}`;
}

/**
 * Extract key "Why" reasoning from hypothesis or insight
 */
export function extractWhyReason(insight: Insight): string {
  // Try to extract the most concise explanation
  const hypothesis = insight.hypothesis.toLowerCase();

  // Look for common patterns
  if (hypothesis.includes('because')) {
    const parts = insight.hypothesis.split(/because/i);
    if (parts[1]) {
      return parts[1].trim().split(/[.!?]/)[0].trim();
    }
  }

  if (hypothesis.includes('due to')) {
    const parts = insight.hypothesis.split(/due to/i);
    if (parts[1]) {
      return parts[1].trim().split(/[.!?]/)[0].trim();
    }
  }

  // Fallback: Use first sentence of hypothesis
  const firstSentence = insight.hypothesis.split(/[.!?]/)[0].trim();
  return firstSentence.length > 100 ? firstSentence.substring(0, 97) + '...' : firstSentence;
}

/**
 * Extract action steps from proposed_action
 * Looks for patterns like "Run a 7-day pilot", "Measure X, Y, Z", etc.
 */
export function extractActionSteps(insight: Insight): {
  experiment?: string;
  metrics?: string;
} {
  const action = insight.proposed_action;

  // Extract experiment details (duration, budget cap)
  const durationMatch = action.match(/(\d+)[\s-]day/i);
  const budgetMatch = action.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(budget\s*cap|cap)?/i);

  let experiment = '';
  if (durationMatch || budgetMatch) {
    const parts: string[] = [];
    if (durationMatch) parts.push(`${durationMatch[1]}-day pilot`);
    if (budgetMatch) parts.push(`$${budgetMatch[1]} cap`);
    experiment = parts.join(', ');
  }

  // Extract metrics to measure
  const metricsMatch = action.match(/measure\s+([^.!?]+)/i);
  let metrics = '';
  if (metricsMatch) {
    metrics = metricsMatch[1].trim();
  }

  return { experiment, metrics };
}
