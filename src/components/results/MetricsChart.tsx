'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TrendingUp, Eye, MousePointer, Users, DollarSign } from 'lucide-react'

interface MetricsChartProps {
  data: Array<{
    date: string
    impressions: number
    clicks: number
    conversions: number
    spend: number
  }>
  timeRange: string
}

export function MetricsChart({ data, timeRange }: MetricsChartProps) {
  // Simple chart simulation using ASCII-style bars
  const getMaxValue = (key: keyof typeof data[0]) => {
    return Math.max(...data.map(d => typeof d[key] === 'number' ? d[key] : 0))
  }

  const getBarHeight = (value: number, maxValue: number) => {
    return Math.max(4, (value / maxValue) * 100)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const maxImpressions = getMaxValue('impressions')
  const maxClicks = getMaxValue('clicks')
  const maxConversions = getMaxValue('conversions')
  const maxSpend = getMaxValue('spend')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Impressions Chart */}
      <Card variant="holo">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-neon-cyan" />
            Impressions Trend
            <Badge variant="info">{timeRange}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 px-2">
              {data.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex items-end h-24">
                    <div
                      className="w-8 bg-gradient-to-t from-neon-cyan to-neon-cyan/50 rounded-t"
                      style={{ height: `${getBarHeight(point.impressions, maxImpressions)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {formatDate(point.date)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-white">
                {data.reduce((sum, d) => sum + d.impressions, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Total Impressions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clicks Chart */}
      <Card variant="holo">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="w-5 h-5 text-neon-emerald" />
            Clicks Trend
            <Badge variant="success">{timeRange}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 px-2">
              {data.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex items-end h-24">
                    <div
                      className="w-8 bg-gradient-to-t from-neon-emerald to-neon-emerald/50 rounded-t"
                      style={{ height: `${getBarHeight(point.clicks, maxClicks)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {formatDate(point.date)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-white">
                {data.reduce((sum, d) => sum + d.clicks, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Total Clicks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversions Chart */}
      <Card variant="holo">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neon-amber" />
            Conversions Trend
            <Badge variant="warning">{timeRange}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 px-2">
              {data.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex items-end h-24">
                    <div
                      className="w-8 bg-gradient-to-t from-neon-amber to-neon-amber/50 rounded-t"
                      style={{ height: `${getBarHeight(point.conversions, maxConversions)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {formatDate(point.date)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-white">
                {data.reduce((sum, d) => sum + d.conversions, 0)}
              </p>
              <p className="text-sm text-gray-400">Total Conversions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spend Chart */}
      <Card variant="holo">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-electric-500" />
            Spend Trend
            <Badge variant="default">{timeRange}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 px-2">
              {data.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex items-end h-24">
                    <div
                      className="w-8 bg-gradient-to-t from-electric-500 to-electric-500/50 rounded-t"
                      style={{ height: `${getBarHeight(point.spend, maxSpend)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    {formatDate(point.date)}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-white">
                ${data.reduce((sum, d) => sum + d.spend, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">Total Spend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combined Performance Metrics */}
      <Card variant="glow" className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-electric-500" />
            Performance Metrics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                <Eye className="w-8 h-8 text-neon-cyan" />
              </div>
              <p className="text-lg font-mono font-bold text-white">
                {((data.reduce((sum, d) => sum + d.clicks, 0) / data.reduce((sum, d) => sum + d.impressions, 0)) * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-gray-400">Click-Through Rate</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neon-emerald/20 flex items-center justify-center">
                <Users className="w-8 h-8 text-neon-emerald" />
              </div>
              <p className="text-lg font-mono font-bold text-white">
                {((data.reduce((sum, d) => sum + d.conversions, 0) / data.reduce((sum, d) => sum + d.clicks, 0)) * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-gray-400">Conversion Rate</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neon-amber/20 flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-neon-amber" />
              </div>
              <p className="text-lg font-mono font-bold text-white">
                ${(data.reduce((sum, d) => sum + d.spend, 0) / data.reduce((sum, d) => sum + d.conversions, 0)).toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">Cost per Acquisition</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-electric-500/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-electric-500" />
              </div>
              <p className="text-lg font-mono font-bold text-white">
                +18.5%
              </p>
              <p className="text-sm text-gray-400">Growth Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}