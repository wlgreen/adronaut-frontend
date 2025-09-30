'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Zap, DollarSign, Users, MousePointer, Eye } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CampaignCard } from '@/components/results/CampaignCard'
import { MetricsChart } from '@/components/results/MetricsChart'
import { PerformanceAlerts } from '@/components/results/PerformanceAlerts'
import { useResultsData } from '@/hooks/useLLMData'

// Fallback sample metrics data for when no real data is available
const sampleMetricsData = [
  { date: '2024-09-25', impressions: 45200, clicks: 1630, conversions: 52, spend: 850 },
  { date: '2024-09-26', impressions: 48900, clicks: 1789, conversions: 58, spend: 875 },
  { date: '2024-09-27', impressions: 52100, clicks: 1945, conversions: 63, spend: 920 },
  { date: '2024-09-28', impressions: 49580, clicks: 1872, conversions: 61, spend: 905 },
]

export default function ResultsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adronaut_project_id') || `proj_${Date.now()}`
    }
    return `proj_${Date.now()}`
  })

  const {
    campaigns,
    performanceAlerts,
    metricsData,
    isAnalyzingPerformance,
    error,
    analyzePerformance
  } = useResultsData(projectId)

  const totalMetrics = campaigns.reduce((total, campaign) => ({
    impressions: total.impressions + campaign.current_metrics.impressions,
    clicks: total.clicks + campaign.current_metrics.clicks,
    conversions: total.conversions + campaign.current_metrics.conversions,
    spend: total.spend + campaign.current_metrics.spend,
    revenue: total.revenue + campaign.current_metrics.revenue
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 })

  const avgMetrics = campaigns.length > 0 ? {
    ctr: totalMetrics.impressions > 0 ? ((totalMetrics.clicks / totalMetrics.impressions) * 100) : 0,
    cpa: totalMetrics.conversions > 0 ? (totalMetrics.spend / totalMetrics.conversions) : 0,
    roas: totalMetrics.spend > 0 ? (totalMetrics.revenue / totalMetrics.spend) : 0,
    conversion_rate: totalMetrics.clicks > 0 ? ((totalMetrics.conversions / totalMetrics.clicks) * 100) : 0
  } : { ctr: 0, cpa: 0, roas: 0, conversion_rate: 0 }

  // Trigger performance analysis when campaigns data is available
  useEffect(() => {
    if (campaigns.length > 0 && performanceAlerts.length === 0 && !isAnalyzingPerformance) {
      analyzePerformance()
    }
  }, [campaigns, performanceAlerts, isAnalyzingPerformance, analyzePerformance])

  return (
    <div>
      <PageHeader
        title="Results"
        description="TELEMETRY DASHBOARD • PERFORMANCE ANALYSIS • REAL-TIME METRICS"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="success" glow>
              {campaigns.filter(c => c.status === 'running').length} Active Campaigns
            </Badge>
            {isAnalyzingPerformance && (
              <Badge variant="warning" glow>
                Analyzing Performance...
              </Badge>
            )}
            <Button variant="primary" size="sm">
              <TrendingUp className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {/* Error Display */}
        {error && (
          <section>
            <Card variant="default" className="border-red-500 bg-red-500/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-400">Performance Analysis Error</h3>
                    <p className="text-sm text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* No Data Warning */}
        {campaigns.length === 0 && (
          <section>
            <Card variant="default" className="border-yellow-500 bg-yellow-500/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div>
                    <h3 className="font-semibold text-yellow-400">No Campaign Data</h3>
                    <p className="text-sm text-yellow-300 mt-1">No campaigns found. Create campaigns from your strategy first.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Performance Overview */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Performance Overview
            </h2>
            <p className="text-gray-400">
              Real-time campaign metrics and key performance indicators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Impressions</p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {totalMetrics.impressions.toLocaleString()}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-neon-cyan" />
                </div>
                <div className="mt-2">
                  <Badge variant="success" className="text-xs">
                    +12% vs last period
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Click-Through Rate</p>
                    <p className="text-2xl font-mono font-bold text-neon-emerald">
                      {avgMetrics.ctr.toFixed(2)}%
                    </p>
                  </div>
                  <MousePointer className="w-8 h-8 text-neon-emerald" />
                </div>
                <div className="mt-2">
                  <Badge variant="success" className="text-xs">
                    Above industry avg
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Cost per Acquisition</p>
                    <p className="text-2xl font-mono font-bold text-neon-amber">
                      ${avgMetrics.cpa.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-neon-amber" />
                </div>
                <div className="mt-2">
                  <Badge variant="warning" className="text-xs">
                    5% above target
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card variant="glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Return on Ad Spend</p>
                    <p className="text-2xl font-mono font-bold text-electric-500">
                      {avgMetrics.roas.toFixed(2)}x
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-electric-500" />
                </div>
                <div className="mt-2">
                  <Badge variant="success" className="text-xs">
                    Strong performance
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Performance Charts */}
        <section>
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold text-white mb-2">
                  Performance Trends
                </h2>
                <p className="text-gray-400">
                  Historical metrics and trend analysis
                </p>
              </div>
              <div className="flex items-center gap-2">
                {['7d', '30d', '90d'].map((range) => (
                  <Button
                    key={range}
                    variant={selectedTimeRange === range ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <MetricsChart
            data={metricsData.length > 0 ? metricsData : sampleMetricsData}
            timeRange={selectedTimeRange}
          />
        </section>

        {/* Active Campaigns */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Active Campaigns
            </h2>
            <p className="text-gray-400">
              Individual campaign performance and status
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.campaign_id}
                campaign={campaign}
                isSelected={selectedCampaign === campaign.campaign_id}
                onClick={() => setSelectedCampaign(
                  selectedCampaign === campaign.campaign_id ? null : campaign.campaign_id
                )}
              />
            ))}
          </div>
        </section>

        {/* Performance Alerts */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-2 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-neon-amber" />
              AI Performance Analysis
            </h2>
            <p className="text-gray-400">
              Automated insights and optimization recommendations
            </p>
          </div>

          <PerformanceAlerts alerts={performanceAlerts} />
        </section>
      </div>
    </div>
  )
}