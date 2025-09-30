'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-500 to-neon-cyan flex items-center justify-center shadow-glow">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-bold text-white glow-text">
            Analysis Snapshot
          </h3>
          <p className="text-sm text-gray-400 font-mono">
            AI-extracted insights from uploaded artifacts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Audience Segments */}
        <Card variant="holo" className="col-span-1 lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-electric-500" />
              Audience Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.audience_segments.map((segment, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{segment.name}</h4>
                  <Badge variant={getValueScoreColor(segment.value_score)} glow>
                    Score: {segment.value_score}/10
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Size Estimate</span>
                    <span className="text-neon-cyan font-mono">{segment.size_estimate}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Characteristics</p>
                    <div className="flex flex-wrap gap-1">
                      {segment.characteristics.map((char, idx) => (
                        <Badge key={idx} variant="info" className="text-xs">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Progress
                    value={segment.value_score * 10}
                    variant={getValueScoreColor(segment.value_score) as any}
                    className="mt-2"
                  />
                </div>

                {index < snapshot.audience_segments.length - 1 && (
                  <div className="border-t border-space-300 pt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Content Themes */}
        <Card variant="holo">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-neon-cyan" />
              Content Themes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.content_themes.map((theme, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{theme.theme}</h4>
                  <Badge variant={getPerformanceColor(theme.performance)} glow>
                    {theme.performance.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1">
                  {theme.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="default" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                {index < snapshot.content_themes.length - 1 && (
                  <div className="border-t border-space-300 pt-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-emerald" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(snapshot.performance_metrics).map(([key, value]) => (
                <div key={key} className="text-center">
                  <p className="text-2xl font-mono font-bold text-neon-emerald glow-text">
                    {value}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    {key.replace('_', ' ')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Insights */}
        <Card variant="holo">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-neon-amber" />
              Geographic Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {snapshot.geographic_insights.map((geo, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{geo.region}</h4>
                  <Badge variant={getPerformanceColor(geo.performance)}>
                    {geo.performance.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400">{geo.opportunity}</p>

                {index < snapshot.geographic_insights.length - 1 && (
                  <div className="border-t border-space-300 pt-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Temporal Patterns */}
        <Card variant="holo">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-electric-400" />
              Temporal Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Best Days</p>
              <div className="flex flex-wrap gap-1">
                {snapshot.temporal_patterns.best_days.map((day, idx) => (
                  <Badge key={idx} variant="success" className="text-xs">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Best Hours</p>
              <div className="flex flex-wrap gap-1">
                {snapshot.temporal_patterns.best_hours.map((hour, idx) => (
                  <Badge key={idx} variant="info" className="text-xs">
                    {hour}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">Seasonal Trends</p>
              <p className="text-sm text-white">{snapshot.temporal_patterns.seasonal_trends}</p>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card variant="glow" className="col-span-1 lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-electric-500" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {snapshot.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-electric-500 mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{rec}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}