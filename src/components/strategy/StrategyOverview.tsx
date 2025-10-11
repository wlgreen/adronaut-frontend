'use client'

import { Users, MessageSquare, Radio, DollarSign, Target, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'

interface StrategyOverviewProps {
  strategy: {
    audience_targeting: {
      segments: Array<{
        name: string
        targeting_criteria: any
        budget_allocation: string
        priority: string
      }>
    }
    messaging_strategy: {
      primary_message: string
      tone: string
      key_themes: string[]
    }
    channel_strategy: {
      primary_channels: string[]
      budget_split: Record<string, string>
      scheduling: {
        peak_hours: string[]
        peak_days: string[]
      }
    }
    budget_allocation: {
      total_budget: string
      channel_breakdown: Record<string, string>
      optimization_strategy: string
    }
  }
}

export function StrategyOverview({ strategy }: StrategyOverviewProps) {
  // Add comprehensive safety check for strategy object
  if (!strategy) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">No strategy data available</p>
      </div>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      case 'low': return 'default'
      default: return 'default'
    }
  }

  const formatChannelName = (channel: string) => {
    return channel
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getBudgetPercentage = (amount: string, total: string) => {
    const amountNum = parseFloat(amount.replace(/[$,]/g, ''))
    const totalNum = parseFloat(total.replace(/[$,]/g, ''))
    return Math.round((amountNum / totalNum) * 100)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Audience Targeting */}
      <Card variant="glow" className="col-span-1 lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-electric-500" />
            Audience Segments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {strategy.audience_targeting?.segments?.map((segment, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">{segment.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(segment.priority) as any}>
                    {segment.priority.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-mono text-neon-emerald">
                    {segment.budget_allocation}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Progress
                  value={parseInt(segment.budget_allocation.replace('%', ''))}
                  variant="success"
                  className="h-2"
                />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(segment.targeting_criteria).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-gray-400 capitalize">{key.replace('_', ' ')}</p>
                      <p className="text-white font-medium">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {index < (strategy.audience_targeting?.segments?.length || 0) - 1 && (
                <div className="border-t border-space-300" />
              )}
            </div>
          ))}
          {(!strategy.audience_targeting?.segments || strategy.audience_targeting.segments.length === 0) && (
            <div className="text-center py-8">
              <p className="text-slate-400">No audience segments available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messaging Strategy */}
      <Card variant="holo">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-neon-cyan" />
            Messaging Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategy.messaging_strategy ? (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Primary Message</h4>
                <p className="text-white font-medium leading-relaxed">
                  &quot;{strategy.messaging_strategy.primary_message || 'No primary message available'}&quot;
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Tone</h4>
                <Badge variant="info" className="capitalize">
                  {strategy.messaging_strategy.tone || 'Default'}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Key Themes</h4>
                <div className="flex flex-wrap gap-2">
                  {strategy.messaging_strategy.key_themes?.map((theme, idx) => (
                    <Badge key={idx} variant="default" className="text-xs capitalize">
                      {theme}
                    </Badge>
                  )) || (
                    <Badge variant="default" className="text-xs">
                      No themes available
                    </Badge>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No messaging strategy available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Strategy */}
      <Card variant="holo">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-neon-amber" />
            Channel Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategy.channel_strategy ? (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Channel Distribution</h4>
                <div className="space-y-3">
                  {strategy.channel_strategy.budget_split ?
                    Object.entries(strategy.channel_strategy.budget_split).map(([channel, percentage]) => (
                      <div key={channel} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{formatChannelName(channel)}</span>
                          <span className="text-neon-emerald font-mono">{percentage}</span>
                        </div>
                        <Progress
                          value={parseInt(String(percentage).replace('%', ''))}
                          variant="warning"
                          className="h-1"
                        />
                      </div>
                    )) : (
                      <div className="text-center py-4">
                        <p className="text-slate-400">No channel distribution available</p>
                      </div>
                    )
                  }
                </div>
              </div>

              <div className="border-t border-space-300 pt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Optimal Schedule</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Peak Days</p>
                    <div className="flex flex-wrap gap-1">
                      {strategy.channel_strategy.scheduling?.peak_days?.map((day, idx) => (
                        <Badge key={idx} variant="success" className="text-xs">
                          {day}
                        </Badge>
                      )) || (
                        <Badge variant="default" className="text-xs">
                          No peak days available
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Peak Hours</p>
                    <div className="flex flex-wrap gap-1">
                      {strategy.channel_strategy.scheduling?.peak_hours?.map((hour, idx) => (
                        <Badge key={idx} variant="info" className="text-xs">
                          {hour}
                        </Badge>
                      )) || (
                        <Badge variant="default" className="text-xs">
                          No peak hours available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No channel strategy available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Allocation */}
      <Card variant="glow" className="col-span-1 lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-neon-emerald" />
            Budget Allocation
            <Badge variant="success" glow>
              {strategy.budget_allocation?.total_budget || 'No budget set'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-4">Channel Breakdown</h4>
              <div className="space-y-4">
                {strategy.budget_allocation?.channel_breakdown ?
                  Object.entries(strategy.budget_allocation?.channel_breakdown || {}).map(([channel, amount]) => (
                    <div key={channel} className="flex items-center justify-between p-3 rounded-lg bg-space-200/50">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-neon-emerald" />
                        <span className="text-white font-medium">{formatChannelName(channel)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-neon-emerald font-mono font-bold">{amount}</p>
                        <p className="text-xs text-gray-400">
                          {getBudgetPercentage(amount, strategy.budget_allocation?.total_budget || '0')}%
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="p-4 rounded-lg bg-space-200/30 border border-space-300">
                      <p className="text-gray-400 text-sm text-center">
                        Channel breakdown will be available after budget optimization
                      </p>
                    </div>
                  )
                }
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-4">Optimization Strategy</h4>
              <div className="p-4 rounded-lg bg-electric-500/10 border border-electric-500/30">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-electric-500 mt-0.5" />
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {strategy.budget_allocation?.optimization_strategy || 'No optimization strategy available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}