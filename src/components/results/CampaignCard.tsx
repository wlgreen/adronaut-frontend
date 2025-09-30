'use client'

import React from 'react'
import { Play, Pause, CheckCircle, TrendingUp, TrendingDown, Users, Eye, MousePointer, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { clsx } from 'clsx'

interface CampaignCardProps {
  campaign: {
    campaign_id: string
    name: string
    status: 'running' | 'completed' | 'paused'
    start_date: string
    strategy_version: number
    platforms: string[]
    current_metrics: {
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
    }
    performance_indicators: {
      ctr: number
      cpa: number
      roas: number
      conversion_rate: number
    }
  }
  isSelected: boolean
  onClick: () => void
}

export function CampaignCard({ campaign, isSelected, onClick }: CampaignCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      default: return <Play className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'success'
      case 'paused': return 'warning'
      case 'completed': return 'default'
      default: return 'default'
    }
  }

  const formatPlatform = (platform: string) => {
    return platform
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getPerformanceIndicator = (value: number, type: 'ctr' | 'cpa' | 'roas' | 'conversion_rate') => {
    // Simple performance scoring based on typical benchmarks
    let isGood = false
    switch (type) {
      case 'ctr':
        isGood = value > 2.5 // CTR above 2.5% is generally good
        break
      case 'cpa':
        isGood = value < 20 // CPA below $20 is generally good
        break
      case 'roas':
        isGood = value > 3 // ROAS above 3x is generally good
        break
      case 'conversion_rate':
        isGood = value > 2.5 // Conversion rate above 2.5% is generally good
        break
    }
    return isGood ? TrendingUp : TrendingDown
  }

  const getPerformanceColor = (value: number, type: 'ctr' | 'cpa' | 'roas' | 'conversion_rate') => {
    const Icon = getPerformanceIndicator(value, type)
    return Icon === TrendingUp ? 'text-success' : 'text-error'
  }

  const daysSinceStart = Math.floor(
    (new Date().getTime() - new Date(campaign.start_date).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card
      variant={isSelected ? "elevated" : "glass"}
      hover={true}
      className={clsx(
        "transition-all duration-200 cursor-pointer",
        {
          "ring-2 ring-primary/50": isSelected,
        }
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className={clsx(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              {
                "bg-success/20 text-success": campaign.status === 'running',
                "bg-warning/20 text-warning": campaign.status === 'paused',
                "bg-surface text-gray-400": campaign.status === 'completed',
              }
            )}>
              {getStatusIcon(campaign.status)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {campaign.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusColor(campaign.status) as any} glow>
                  {campaign.status.toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-400 font-mono">
                  Strategy v{campaign.strategy_version}
                </span>
              </div>
            </div>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Campaign Info */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-gray-400">Runtime</p>
            <p className="text-white font-medium">{daysSinceStart} days</p>
          </div>
          <div>
            <p className="text-gray-400">Platforms</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {campaign.platforms.map((platform, idx) => (
                <Badge key={idx} variant="info" className="text-xs">
                  {formatPlatform(platform)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-accent-cyan" />
              <span className="text-xs text-gray-400">Impressions</span>
            </div>
            <p className="text-lg font-mono font-bold text-white">
              {campaign.current_metrics.impressions.toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MousePointer className="w-4 h-4 text-success" />
              <span className="text-xs text-gray-400">Clicks</span>
            </div>
            <p className="text-lg font-mono font-bold text-white">
              {campaign.current_metrics.clicks.toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-4 h-4 text-warning" />
              <span className="text-xs text-gray-400">Conversions</span>
            </div>
            <p className="text-lg font-mono font-bold text-white">
              {campaign.current_metrics.conversions}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-gray-400">Revenue</span>
            </div>
            <p className="text-lg font-mono font-bold text-white">
              ${campaign.current_metrics.revenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Performance Indicators</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-2 rounded bg-surface/50">
              <span className="text-xs text-gray-400">CTR</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-bold text-white">
                  {campaign.performance_indicators.ctr.toFixed(2)}%
                </span>
                {React.createElement(
                  getPerformanceIndicator(campaign.performance_indicators.ctr, 'ctr'),
                  { className: `w-3 h-3 ${getPerformanceColor(campaign.performance_indicators.ctr, 'ctr')}` }
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-surface/50">
              <span className="text-xs text-gray-400">CPA</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-bold text-white">
                  ${campaign.performance_indicators.cpa.toFixed(2)}
                </span>
                {React.createElement(
                  getPerformanceIndicator(campaign.performance_indicators.cpa, 'cpa'),
                  { className: `w-3 h-3 ${getPerformanceColor(campaign.performance_indicators.cpa, 'cpa')}` }
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-surface/50">
              <span className="text-xs text-gray-400">ROAS</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-bold text-white">
                  {campaign.performance_indicators.roas.toFixed(2)}x
                </span>
                {React.createElement(
                  getPerformanceIndicator(campaign.performance_indicators.roas, 'roas'),
                  { className: `w-3 h-3 ${getPerformanceColor(campaign.performance_indicators.roas, 'roas')}` }
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-surface/50">
              <span className="text-xs text-gray-400">Conv Rate</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-bold text-white">
                  {campaign.performance_indicators.conversion_rate.toFixed(2)}%
                </span>
                {React.createElement(
                  getPerformanceIndicator(campaign.performance_indicators.conversion_rate, 'conversion_rate'),
                  { className: `w-3 h-3 ${getPerformanceColor(campaign.performance_indicators.conversion_rate, 'conversion_rate')}` }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Spend Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Budget Utilization</span>
            <span className="text-sm font-mono text-white">
              ${campaign.current_metrics.spend.toLocaleString()} spent
            </span>
          </div>
          <Progress
            value={65} // Simulated budget utilization
            variant="success"
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  )
}