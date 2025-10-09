'use client'

import { PremiumCard } from '@/components/ui/PremiumCard'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Brain, Users, MapPin, Clock, TrendingUp, Zap } from 'lucide-react'

interface AnalysisSnapshotProps {
  snapshot: any  // Backend returns raw features, we'll transform them
}

export function AnalysisSnapshot({ snapshot }: AnalysisSnapshotProps) {
  // Transform backend features into UI-friendly structure
  const transformedSnapshot = {
    audience_segments: Array.isArray(snapshot?.target_audience?.segments)
      ? snapshot.target_audience.segments
      : [],
    content_themes: Array.isArray(snapshot?.messaging)
      ? snapshot.messaging.map((msg: string, idx: number) => ({
          theme: `Theme ${idx + 1}`,
          performance: 'medium' as const,
          keywords: [msg]
        }))
      : [],
    performance_metrics: snapshot?.metrics?.campaigns
      ? Object.values(snapshot.metrics.campaigns).reduce((acc: any, campaign: any) => {
          return {
            conversion_rate: campaign.ctr || 'N/A',
            engagement_rate: campaign.ctr || 'N/A',
            cost_per_acquisition: campaign.cpa || 'N/A',
            roi: campaign.roas || 'N/A'
          }
        }, {})
      : null,
    geographic_insights: snapshot?.geographic_insights || {},
    temporal_patterns: {
      best_days: [],
      best_hours: [],
      seasonal_trends: snapshot?.recommendations_from_data?.[0] || 'No seasonal data available'
    },
    recommendations: Array.isArray(snapshot?.recommendations_from_data)
      ? snapshot.recommendations_from_data
      : []
  }

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
                {transformedSnapshot.performance_metrics && Object.entries(transformedSnapshot.performance_metrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-3xl font-mono font-bold text-emerald-400 mb-1">
                      {value}
                    </p>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">
                      {key.replace('_', ' ')}
                    </p>
                  </div>
                ))}
                {!transformedSnapshot.performance_metrics && (
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
                {transformedSnapshot.recommendations?.slice(0, 3).map((rec: any, index: number) => {
                  // Handle both string and object formats
                  const text = typeof rec === 'string' ? rec : rec.recommendation || rec.action || JSON.stringify(rec)
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
                    </div>
                  )
                })}
                {transformedSnapshot.recommendations && transformedSnapshot.recommendations.length > 3 && (
                  <div className="pt-2 border-t border-space-300">
                    <p className="text-xs text-gray-400">+{transformedSnapshot.recommendations.length - 3} more recommendations</p>
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
              {transformedSnapshot.audience_segments?.map((segment: any, index: number) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-white text-base">{segment.name}</h5>
                    {segment.value_score && (
                      <Badge variant={getValueScoreColor(segment.value_score)} glow>
                        Score: {segment.value_score}/10
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    {segment.size_estimate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Size Estimate</span>
                        <span className="text-cyan-400 font-mono font-medium">{segment.size_estimate}</span>
                      </div>
                    )}

                    {segment.characteristics && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Key Characteristics</p>
                        <div className="flex flex-wrap gap-2">
                          {segment.characteristics?.slice(0, 4).map((char: string, idx: number) => (
                            <Badge key={idx} variant="info" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                          {segment.characteristics && segment.characteristics.length > 4 && (
                            <Badge variant="default" className="text-xs">
                              +{segment.characteristics.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {segment.value_score && (
                      <Progress
                        value={segment.value_score * 10}
                        variant={getValueScoreColor(segment.value_score) as any}
                        className="mt-3"
                      />
                    )}
                  </div>

                  {index < transformedSnapshot.audience_segments.length - 1 && (
                    <div className="border-t border-space-300 pt-2" />
                  )}
                </div>
              ))}
              {(!transformedSnapshot.audience_segments || transformedSnapshot.audience_segments.length === 0) && (
                <p className="text-sm text-gray-400">No audience segments available</p>
              )}
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
              {transformedSnapshot.content_themes?.map((theme: any, index: number) => (
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
                      {theme.keywords?.slice(0, 6).map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="default" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {theme.keywords && theme.keywords.length > 6 && (
                        <Badge variant="default" className="text-xs opacity-60">
                          +{theme.keywords.length - 6} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {index < transformedSnapshot.content_themes.length - 1 && (
                    <div className="border-t border-space-300 pt-2" />
                  )}
                </div>
              ))}
              {(!transformedSnapshot.content_themes || transformedSnapshot.content_themes.length === 0) && (
                <p className="text-sm text-gray-400">No content themes available</p>
              )}
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
              {transformedSnapshot.geographic_insights && typeof transformedSnapshot.geographic_insights === 'object' && transformedSnapshot.geographic_insights !== 'insufficient_evidence' ? (
                Object.entries(transformedSnapshot.geographic_insights.by_campaign || {}).map(([campaignId, data]: [string, any], index, arr) => (
                  <div key={campaignId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-white text-base">{campaignId}</h5>
                    </div>
                    <div className="text-sm text-gray-300 leading-relaxed">
                      {data.top_geos && <div>Top locations: {data.top_geos.join(', ')}</div>}
                      {data.performance_notes && <div className="mt-1">{data.performance_notes}</div>}
                    </div>

                    {index < arr.length - 1 && (
                      <div className="border-t border-space-300 pt-2" />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No geographic insights available</p>
              )}
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
                {transformedSnapshot.temporal_patterns?.best_days && transformedSnapshot.temporal_patterns.best_days.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3 font-medium">Optimal Days</p>
                    <div className="flex flex-wrap gap-2">
                      {transformedSnapshot.temporal_patterns.best_days.map((day: string, idx: number) => (
                        <Badge key={idx} variant="success" className="text-xs">
                          {day}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {transformedSnapshot.temporal_patterns?.best_hours && transformedSnapshot.temporal_patterns.best_hours.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-3 font-medium">Peak Hours</p>
                    <div className="flex flex-wrap gap-2">
                      {transformedSnapshot.temporal_patterns.best_hours.map((hour: string, idx: number) => (
                        <Badge key={idx} variant="info" className="text-xs">
                          {hour}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-space-300">
                  <p className="text-sm text-gray-400 mb-2 font-medium">Seasonal Trends</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{transformedSnapshot.temporal_patterns?.seasonal_trends || 'No seasonal data available'}</p>
                </div>
              </div>
            </div>
          </PremiumCard>
        </div>
      </section>
    </div>
  )
}