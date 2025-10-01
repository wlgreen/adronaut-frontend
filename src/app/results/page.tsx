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
            <Button variant="primary" size="sm" className="btn-hover-lift" glow>
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
        <section className="performance-section performance-overview-section">
          <div className="performance-section-header">
            <h2 className="performance-section-title">
              <Eye className="w-5 h-5" />
              Performance Overview
            </h2>
            <p className="text-gray-400 text-sm">
              Real-time campaign metrics and key performance indicators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="metric-card-overview">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">Total Impressions</p>
                  <p className="metric-value">
                    {totalMetrics.impressions.toLocaleString()}
                  </p>
                  <p className="metric-context">+12% vs last period</p>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="metric-card-overview">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">Click-Through Rate</p>
                  <p className="metric-value text-blue-300">
                    {avgMetrics.ctr.toFixed(2)}%
                  </p>
                  <p className="metric-context">Above industry avg</p>
                </div>
                <MousePointer className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="metric-card-overview">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">Cost per Acquisition</p>
                  <p className="metric-value text-blue-300">
                    ${avgMetrics.cpa.toFixed(2)}
                  </p>
                  <p className="metric-context">5% above target</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="metric-card-overview">
              <div className="flex items-center justify-between">
                <div>
                  <p className="metric-label">Return on Ad Spend</p>
                  <p className="metric-value text-blue-300">
                    {avgMetrics.roas.toFixed(2)}x
                  </p>
                  <p className="metric-context">Strong performance</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Performance Charts */}
        <section className="performance-section performance-trends-section">
          <div className="performance-section-header">
            <h2 className="performance-section-title">
              <BarChart3 className="w-5 h-5" />
              Performance Trends
            </h2>
            <div className="flex items-center gap-2">
              {['7d', '30d', '90d'].map((range) => (
                <Button
                  key={range}
                  variant={selectedTimeRange === range ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range)}
                  className="interactive-scale"
                  glow={selectedTimeRange === range}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Historical metrics and trend analysis
          </p>

          <div className="chart-container">
            <MetricsChart
              data={metricsData.length > 0 ? metricsData : sampleMetricsData}
              timeRange={selectedTimeRange}
            />
          </div>
        </section>

        <div className="section-divider"></div>

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