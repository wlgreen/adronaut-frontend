'use client'

import { PremiumCard } from '@/components/ui/PremiumCard'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Brain, Users, MapPin, Clock, TrendingUp, Zap, Lightbulb } from 'lucide-react'
import { InsightsCard } from '@/components/workspace/InsightsCard'
import type { Insight } from '@/types/insights'

interface AnalysisSnapshotProps {
  snapshot: any  // Backend returns raw features, we'll transform them
}

export function AnalysisSnapshot({ snapshot }: AnalysisSnapshotProps) {
  // Debug: Log what we receive
  console.log('🎨 [AnalysisSnapshot] Received snapshot:', {
    hasSnapshot: !!snapshot,
    keys: snapshot ? Object.keys(snapshot) : [],
    hasFeatures: !!snapshot?.features,
    hasInsights: !!snapshot?.insights,
    hasAudienceSegments: !!snapshot?.audience_segments,
    fullSnapshot: snapshot
  })

  // Detect format: raw backend format vs old transformed format
  const isRawFormat = snapshot?.features || snapshot?.insights
  const isOldTransformedFormat = snapshot?.audience_segments || snapshot?.content_themes

  console.log('🔍 [AnalysisSnapshot] Format detection:', {
    isRawFormat,
    isOldTransformedFormat
  })

  // Extract insights - handle both formats
  let insights: Insight[] = []
  if (isRawFormat) {
    // New raw format: snapshot.insights.insights
    insights = snapshot?.insights?.insights || []
  }
  const hasInsights = insights.length > 0
  const hasWeakInsights = insights.some((i: Insight) => i.data_support === 'weak')

  console.log('💡 [AnalysisSnapshot] Insights check:', {
    isRawFormat,
    hasInsightsKey: !!snapshot?.insights,
    hasNestedInsights: !!snapshot?.insights?.insights,
    insightCount: insights.length,
    hasWeakInsights,
    insights
  })

  // Transform data for display - handle both formats
  let transformedSnapshot: any

  if (isRawFormat) {
    // New raw format - transform from features
    const features = snapshot.features || {}
    console.log('📊 [AnalysisSnapshot] Transforming from raw format, features:', features)

    transformedSnapshot = {
      audience_segments: Array.isArray(features?.target_audience?.segments)
        ? features.target_audience.segments
        : [],
      content_themes: Array.isArray(features?.messaging)
        ? features.messaging.map((msg: string, idx: number) => ({
            theme: `Theme ${idx + 1}`,
            performance: 'medium' as const,
            keywords: [msg]
          }))
        : [],
      performance_metrics: features?.metrics?.campaigns && typeof features.metrics.campaigns === 'object' && features.metrics.campaigns !== 'insufficient_evidence'
        ? Object.values(features.metrics.campaigns).reduce((acc: any, campaign: any) => {
            return {
              conversion_rate: campaign.ctr || 'N/A',
              engagement_rate: campaign.ctr || 'N/A',
              cost_per_acquisition: campaign.cpa || 'N/A',
              roi: campaign.roas || 'N/A'
            }
          }, {})
        : null,
      geographic_insights: features?.geographic_insights || {},
      temporal_patterns: {
        best_days: [],
        best_hours: [],
        seasonal_trends: features?.recommendations_from_data?.[0] || 'No seasonal data available'
      },
      recommendations: Array.isArray(features?.recommendations_from_data)
        ? features.recommendations_from_data
        : [],
      channels: Array.isArray(features?.channels) ? features.channels : []
    }
  } else if (isOldTransformedFormat) {
    // Old transformed format - use directly
    console.log('📊 [AnalysisSnapshot] Using old transformed format directly')
    transformedSnapshot = {
      audience_segments: snapshot.audience_segments || [],
      content_themes: snapshot.content_themes || [],
      performance_metrics: snapshot.performance_metrics || null,
      geographic_insights: snapshot.geographic_insights || {},
      temporal_patterns: snapshot.temporal_patterns || { best_days: [], best_hours: [], seasonal_trends: 'No data available' },
      recommendations: snapshot.recommendations || [],
      channels: snapshot.channels || []
    }
  } else {
    // Fallback - empty data
    console.warn('⚠️ [AnalysisSnapshot] Unknown format, using empty data')
    transformedSnapshot = {
      audience_segments: [],
      content_themes: [],
      performance_metrics: null,
      geographic_insights: {},
      temporal_patterns: { best_days: [], best_hours: [], seasonal_trends: 'No data available' },
      recommendations: [],
      channels: []
    }
  }

  console.log('📊 [AnalysisSnapshot] Final transformed snapshot:', transformedSnapshot)

  // Check for data completeness
  const hasMetricsData = transformedSnapshot.performance_metrics && Object.keys(transformedSnapshot.performance_metrics).length > 0
  const hasChannelsData = transformedSnapshot.channels.length > 0
  const dataCompleteness = hasMetricsData ? 'complete' : hasChannelsData ? 'partial' : 'minimal'
  const showLimitedDataBanner = !hasMetricsData && hasChannelsData

  const getPerformanceColor = (performance: 'high' | 'medium' | 'low') => {
    switch (performance) {
      case 'high': return 'success'
      case 'medium': return 'warning'
      case 'low': return 'danger'
    }
  }

  const getValueScoreColor = (score: number) => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'danger'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-slate-100">
              Analysis Snapshot
            </h3>
            <Badge
              variant={dataCompleteness === 'complete' ? 'success' : dataCompleteness === 'partial' ? 'warning' : 'default'}
              className="text-xs"
            >
              {dataCompleteness.toUpperCase()} DATA
            </Badge>
          </div>
          <p className="text-sm text-slate-400 font-mono mt-1">
            AI-extracted insights from uploaded artifacts
          </p>
        </div>
      </div>

      {/* Limited Data Banner */}
      {showLimitedDataBanner && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-amber-400 text-xs">!</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-400 text-sm mb-2">Limited Data Analysis</h4>
              <p className="text-xs text-gray-300 mb-3">
                The system analyzed your file but found limited campaign metrics. Recommendations will be based on available data.
              </p>
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer hover:text-gray-300 mb-2">What would help improve analysis?</summary>
                <ul className="space-y-1 mt-2 ml-4">
                  <li>• Campaign performance metrics (impressions, clicks, conversions, spend, revenue)</li>
                  <li>• Audience targeting information (age, location, interests)</li>
                  <li>• Creative performance data (CTR, conversion rates by ad type)</li>
                  <li>• Budget allocation and ROAS by channel/campaign</li>
                </ul>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Strategic Insights - uses InsightsCard component which has its own header */}
      {hasInsights && <InsightsCard insights={insights} />}

      {/* Detected Channels - Moved from Key Performance Insights */}
      {transformedSnapshot.channels && transformedSnapshot.channels.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-cyan-500 to-indigo-500 rounded-full"></div>
            <h4 className="text-lg font-semibold text-slate-100">Detected Channels</h4>
          </div>
          <PremiumCard variant="elevated" className="p-6">
            <div className="space-y-2">
              {transformedSnapshot.channels.map((channel: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-space-200/30 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                  <p className="text-sm text-gray-200">{typeof channel === 'string' ? channel : JSON.stringify(channel)}</p>
                </div>
              ))}
            </div>
          </PremiumCard>
        </section>
      )}
    </div>
  )
}