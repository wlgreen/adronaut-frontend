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
    <div className="space-y-8">
      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Impressions Chart */}
        <div className="metric-card-trends">
          <div className="chart-header">
            <h3 className="chart-title">
              <Eye className="w-5 h-5 text-green-400" />
              Impressions Trend
            </h3>
            <Badge variant="success">{timeRange}</Badge>
          </div>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 px-2">
              {data.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex items-end h-24">
                    <div
                      className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
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
              <p className="metric-value text-green-300">
                {data.reduce((sum, d) => sum + d.impressions, 0).toLocaleString()}
              </p>
              <p className="metric-label">Total Impressions</p>
            </div>
          </div>
        </div>

        {/* Clicks Chart */}
        <div className="metric-card-trends">
          <div className="chart-header">
            <h3 className="chart-title">
              <MousePointer className="w-5 h-5 text-green-400" />
              Clicks Trend
            </h3>
            <Badge variant="success">{timeRange}</Badge>
          </div>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 px-2">
              {data.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex items-end h-24">
                    <div
                      className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
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
              <p className="metric-value text-green-300">
                {data.reduce((sum, d) => sum + d.clicks, 0).toLocaleString()}
              </p>
              <p className="metric-label">Total Clicks</p>
            </div>
          </div>
        </div>

        {/* Conversions Chart */}
        <div className="metric-card-trends">
          <div className="chart-header">
            <h3 className="chart-title">
              <Users className="w-5 h-5 text-green-400" />
              Conversions Trend
            </h3>
            <Badge variant="success">{timeRange}</Badge>
          </div>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 px-2">
              {data.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex items-end h-24">
                    <div
                      className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
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
              <p className="metric-value text-green-300">
                {data.reduce((sum, d) => sum + d.conversions, 0)}
              </p>
              <p className="metric-label">Total Conversions</p>
            </div>
          </div>
        </div>

        {/* Spend Chart */}
        <div className="metric-card-trends">
          <div className="chart-header">
            <h3 className="chart-title">
              <DollarSign className="w-5 h-5 text-green-400" />
              Spend Trend
            </h3>
            <Badge variant="success">{timeRange}</Badge>
          </div>
          <div className="space-y-4">
            <div className="flex items-end justify-between h-32 px-2">
              {data.map((point, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex items-end h-24">
                    <div
                      className="w-8 bg-gradient-to-t from-green-500 to-green-400 rounded-t"
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
              <p className="metric-value text-green-300">
                ${data.reduce((sum, d) => sum + d.spend, 0).toLocaleString()}
              </p>
              <p className="metric-label">Total Spend</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics Section */}
      <div className="section-divider"></div>

      <div className="performance-section performance-metrics-section">
        <div className="performance-section-header">
          <h2 className="performance-section-title">
            <TrendingUp className="w-5 h-5" />
            Performance Metrics Overview
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="metric-card-performance">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-value text-orange-300">
                  {((data.reduce((sum, d) => sum + d.clicks, 0) / data.reduce((sum, d) => sum + d.impressions, 0)) * 100).toFixed(2)}%
                </p>
                <p className="metric-label">Click-Through Rate</p>
              </div>
              <Eye className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="metric-card-performance">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-value text-orange-300">
                  {((data.reduce((sum, d) => sum + d.conversions, 0) / data.reduce((sum, d) => sum + d.clicks, 0)) * 100).toFixed(2)}%
                </p>
                <p className="metric-label">Conversion Rate</p>
              </div>
              <Users className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="metric-card-performance">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-value text-orange-300">
                  ${(data.reduce((sum, d) => sum + d.spend, 0) / data.reduce((sum, d) => sum + d.conversions, 0)).toFixed(2)}
                </p>
                <p className="metric-label">Cost per Acquisition</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <div className="metric-card-performance">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-value text-orange-300">
                  +18.5%
                </p>
                <p className="metric-label">Growth Rate</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}