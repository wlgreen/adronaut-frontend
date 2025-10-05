'use client'

import { AlertTriangle, TrendingUp, Lightbulb, Brain, ArrowRight, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'

interface PerformanceAlertsProps {
  alerts: Array<{
    id: string
    type: 'optimization' | 'opportunity' | 'warning'
    severity: 'low' | 'medium' | 'high'
    title: string
    description: string
    recommendation: string
    created_at: string
  }>
}

export function PerformanceAlerts({ alerts }: PerformanceAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'optimization': return AlertTriangle
      case 'opportunity': return TrendingUp
      case 'warning': return AlertTriangle
      default: return Lightbulb
    }
  }

  const getAlertColor = (type: string, severity: string) => {
    if (severity === 'high') return 'danger'
    if (type === 'opportunity') return 'success'
    if (type === 'optimization') return 'warning'
    return 'info'
  }

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'HIGH PRIORITY'
      case 'medium': return 'MEDIUM'
      case 'low': return 'LOW'
      default: return 'INFO'
    }
  }

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId])
  }

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id))

  if (visibleAlerts.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-emerald/20 flex items-center justify-center">
            <Brain className="w-8 h-8 text-neon-emerald" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">All Systems Optimal</h3>
          <p className="text-gray-400">
            No performance issues detected. All campaigns are running within target parameters.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {visibleAlerts.map((alert) => {
        const Icon = getAlertIcon(alert.type)
        const colorVariant = getAlertColor(alert.type, alert.severity)

        return (
          <Card key={alert.id} variant="glass" className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    colorVariant === 'danger' ? 'bg-neon-rose/20 text-neon-rose' :
                    colorVariant === 'warning' ? 'bg-neon-amber/20 text-neon-amber' :
                    colorVariant === 'success' ? 'bg-neon-emerald/20 text-neon-emerald' :
                    'bg-neon-cyan/20 text-neon-cyan'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {alert.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={colorVariant as any} glow>
                        {getSeverityLabel(alert.severity)}
                      </Badge>
                      <Badge variant="default" className="text-xs uppercase">
                        {alert.type}
                      </Badge>
                      <span className="text-xs text-gray-400 font-mono">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardTitle>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => dismissAlert(alert.id)}
                  className="opacity-60 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Alert Description */}
              <div>
                <p className="text-gray-300 leading-relaxed">
                  {alert.description}
                </p>
              </div>

              {/* AI Recommendation */}
              <div className="border-t border-space-300 pt-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-electric-500/10 border border-electric-500/30">
                  <Brain className="w-5 h-5 text-electric-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white mb-2">AI Recommendation</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {alert.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button variant="primary" size="sm" className="flex-1">
                  <ArrowRight className="w-4 h-4" />
                  Apply Recommendation
                </Button>
                <Button variant="secondary" size="sm">
                  View Details
                </Button>
                <Button variant="secondary" size="sm">
                  Snooze
                </Button>
              </div>
            </CardContent>

            {/* Severity Indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              alert.severity === 'high' ? 'bg-neon-rose' :
              alert.severity === 'medium' ? 'bg-neon-amber' :
              'bg-neon-cyan'
            }`} />
          </Card>
        )
      })}

      {/* Summary Stats */}
      <Card variant="elevated">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-rose" />
                <span className="text-sm text-gray-400">
                  High Priority: {alerts.filter(a => a.severity === 'high').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-amber" />
                <span className="text-sm text-gray-400">
                  Medium: {alerts.filter(a => a.severity === 'medium').length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-neon-cyan" />
                <span className="text-sm text-gray-400">
                  Low: {alerts.filter(a => a.severity === 'low').length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-electric-500" />
              <span className="text-sm text-gray-400">
                AI Analysis Active
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}