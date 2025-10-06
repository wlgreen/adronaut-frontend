'use client'

import { PremiumCard } from '@/components/ui/PremiumCard'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Brain, Users, MapPin, Clock, TrendingUp, Zap } from 'lucide-react'

interface AnalysisSnapshotProps {
  snapshot: {
    audience_segments: Array<{
      name: string
      characteristics: string[]
      size_estimate: string
      value_score: number
    }>
    content_themes: Array<{
      theme: string
      performance: 'high' | 'medium' | 'low'
      keywords: string[]
    }>
    performance_metrics: {
      conversion_rate: string
      engagement_rate: string
      cost_per_acquisition: string
      roi: string
    }
    geographic_insights: Array<{
      region: string
      performance: 'high' | 'medium' | 'low'
      opportunity: string
    }>
    temporal_patterns: {
      best_days: string[]
      best_hours: string[]
      seasonal_trends: string
    }
    recommendations: string[]
  }
}

export function AnalysisSnapshot({ snapshot }: AnalysisSnapshotProps) {
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
        <div>
          <h3 className="text-2xl font-bold text-slate-100">
            Analysis Snapshot
          </h3>
          <p className="text-sm text-slate-400 font-mono">
            AI-extracted insights from uploaded artifacts
          </p>
        </div>
      </div>

      {/* Key Performance Insights - Top Priority */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-indigo-500 rounded-full"></div>
          <h4 className="text-lg font-semibold text-slate-100">Key Performance Insights</h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics - Elevated prominence */}
          <PremiumCard variant="elevated" className="p-6">
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <span className="text-lg font-semibold text-slate-100">Performance Metrics</span>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-6">
                {snapshot.performance_metrics && Object.entries(snapshot.performance_metrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-3xl font-mono font-bold text-emerald-400 mb-1">
                      {value}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      {key.replace('_', ' ')}
                    </p>
                  </div>
                ))}
                {!snapshot.performance_metrics && (
                  <div className="col-span-2 text-center py-4">
                    <p className="text-slate-400">Performance metrics not available</p>
                  </div>
                )}
              </div>
            </div>
          </PremiumCard>

          {/* AI Recommendations - High priority */}
          <PremiumCard variant="elevated" className="p-6">
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-indigo-400" />
                <span className="text-lg font-semibold text-slate-100">AI Recommendations</span>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                {snapshot.recommendations?.slice(0, 3).map((rec, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-300 leading-relaxed">{rec}</p>
                  </div>
                ))}
                {snapshot.recommendations.length > 3 && (
                  <div className="pt-2 border-t border-space-300">
                    <p className="text-xs text-gray-400">+{snapshot.recommendations.length - 3} more recommendations</p>
                  </div>
                )}
              </div>
            </div>
          </PremiumCard>
        </div>
      </section>

      {/* Audience & Content Analysis */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-8 bg-gradient-to-b from-indigo-400 to-cyan-500 rounded-full"></div>
          <h4 className="text-lg font-semibold text-slate-100">Audience & Content Analysis</h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audience Segments */}
          <PremiumCard variant="elevated" className="p-6">
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Audience Segments</span>
              </div>
            </div>
            <div className=" space-y-6">
              {snapshot.audience_segments?.map((segment, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-white text-base">{segment.name}</h5>
                    <Badge variant={getValueScoreColor(segment.value_score)} glow>
                      Score: {segment.value_score}/10
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Size Estimate</span>
                      <span className="text-cyan-400 font-mono font-medium">{segment.size_estimate}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Key Characteristics</p>
                      <div className="flex flex-wrap gap-2">
                        {segment.characteristics?.slice(0, 4).map((char, idx) => (
                          <Badge key={idx} variant="info" className="text-xs">
                            {char}
                          </Badge>
                        ))}
                        {segment.characteristics.length > 4 && (
                          <Badge variant="default" className="text-xs">
                            +{segment.characteristics.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Progress
                      value={segment.value_score * 10}
                      variant={getValueScoreColor(segment.value_score) as any}
                      className="mt-3"
                    />
                  </div>

                  {index < snapshot.audience_segments.length - 1 && (
                    <div className="border-t border-space-300 pt-2" />
                  )}
                </div>
              ))}
            </div>
          </PremiumCard>

          {/* Content Themes */}
          <PremiumCard variant="elevated" className="p-6">
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>Content Themes</span>
              </div>
            </div>
            <div className=" space-y-5">
              {snapshot.content_themes?.map((theme, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-white text-base">{theme.theme}</h5>
                    <Badge variant={getPerformanceColor(theme.performance)} glow>
                      {theme.performance.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Key Topics</p>
                    <div className="flex flex-wrap gap-2">
                      {theme.keywords?.slice(0, 6).map((keyword, idx) => (
                        <Badge key={idx} variant="default" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {theme.keywords.length > 6 && (
                        <Badge variant="default" className="text-xs opacity-60">
                          +{theme.keywords.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {index < snapshot.content_themes.length - 1 && (
                    <div className="border-t border-space-300 pt-2" />
                  )}
                </div>
              ))}
            </div>
          </PremiumCard>
        </div>
      </section>

      {/* Advanced Analytics */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-indigo-400 rounded-full"></div>
          <h4 className="text-lg font-heading font-semibold text-white">Advanced Analytics</h4>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


          {/* Geographic Insights */}
          <PremiumCard variant="elevated" className="p-6">
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span>Geographic Insights</span>
              </div>
            </div>
            <div className=" space-y-5">
              {snapshot.geographic_insights?.map((geo, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-white text-base">{geo.region}</h5>
                    <Badge variant={getPerformanceColor(geo.performance)} glow>
                      {geo.performance.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{geo.opportunity}</p>

                  {index < snapshot.geographic_insights.length - 1 && (
                    <div className="border-t border-space-300 pt-2" />
                  )}
                </div>
              ))}
            </div>
          </PremiumCard>

          {/* Temporal Patterns */}
          <PremiumCard variant="elevated" className="p-6">
            <div className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>Temporal Patterns</span>
              </div>
            </div>
            <div className=" space-y-5">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 mb-3 font-medium">Optimal Days</p>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.temporal_patterns?.best_days?.map((day, idx) => (
                      <Badge key={idx} variant="success" className="text-xs">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-3 font-medium">Peak Hours</p>
                  <div className="flex flex-wrap gap-2">
                    {snapshot.temporal_patterns?.best_hours?.map((hour, idx) => (
                      <Badge key={idx} variant="info" className="text-xs">
                        {hour}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-space-300">
                  <p className="text-sm text-gray-400 mb-2 font-medium">Seasonal Trends</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{snapshot.temporal_patterns.seasonal_trends}</p>
                </div>
              </div>
            </div>
          </PremiumCard>
        </div>
      </section>
    </div>
  )
}