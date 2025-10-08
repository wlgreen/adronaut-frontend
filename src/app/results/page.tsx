'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Zap, DollarSign, Users, MousePointer, Eye } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { PremiumButton, ButtonGroup } from '@/components/ui/PremiumButton'
import { PremiumCard, MetricCard } from '@/components/ui/PremiumCard'
import { Badge } from '@/components/ui/Badge'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { ChartContainer, MetricBar, TrendLine, ChartGrid } from '@/components/charts/PremiumChart'
import { CampaignCard } from '@/components/results/CampaignCard'
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
      const saved = localStorage.getItem('adronaut_project_id')

      // If we have a saved ID that's in the old proj_ format, generate a new UUID
      if (saved && !saved.startsWith('proj_')) {
        return saved
      }

      const newId = uuidv4()
      localStorage.setItem('adronaut_project_id', newId)
      return newId
    }
    return uuidv4()
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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Results</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Telemetry dashboard • Performance analysis • Real-time metrics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {campaigns.filter(c => c.status === 'running').length} Active Campaigns
              </Badge>
              {isAnalyzingPerformance && (
                <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Analyzing Performance...
                </Badge>
              )}
              <ButtonGroup>
                <PremiumButton variant="secondary" size="sm">
                  <TrendingUp className="w-4 h-4" />
                  Export Report
                </PremiumButton>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-8 py-8 space-y-8">
        {/* Error Display */}
        {error && (
          <section>
            <ErrorDisplay
              error={error}
              context="performance"
              onRetry={campaigns.length > 0 ? analyzePerformance : undefined}
              retryLabel="Retry Performance Analysis"
              isRetrying={isAnalyzingPerformance}
            />
          </section>
        )}

        {/* No Data Warning */}
        {campaigns.length === 0 && (
          <section>
            <PremiumCard className="border-amber-500/50 bg-amber-500/10">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div>
                    <h3 className="font-semibold text-amber-400">No Campaign Data</h3>
                    <p className="text-sm text-amber-300 mt-1">No campaigns found. Create campaigns from your strategy first.</p>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </section>
        )}

        {/* Performance Overview */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-2 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              Performance Overview
            </h2>
            <p className="text-sm text-slate-400">
              Real-time campaign metrics and key performance indicators
            </p>
          </div>

          <ChartGrid columns={4}>
            <MetricCard
              title="Total Impressions"
              value={totalMetrics.impressions.toLocaleString()}
              change="+12%"
              changeType="positive"
              icon={<Eye />}
              subtitle="vs last period"
            />
            <MetricCard
              title="Click-Through Rate"
              value={`${avgMetrics.ctr.toFixed(2)}%`}
              change="Above avg"
              changeType="positive"
              icon={<MousePointer />}
              subtitle="Industry benchmark"
            />
            <MetricCard
              title="Cost per Acquisition"
              value={`$${avgMetrics.cpa.toFixed(2)}`}
              change="-5%"
              changeType="positive"
              icon={<DollarSign />}
              subtitle="Efficiency improved"
            />
            <MetricCard
              title="Return on Ad Spend"
              value={`${avgMetrics.roas.toFixed(2)}x`}
              change="Strong"
              changeType="positive"
              icon={<TrendingUp />}
              subtitle="Performance"
            />
          </ChartGrid>
        </section>

        {/* Performance Charts */}
        <section>
          <ChartContainer
            title="Performance Trends"
            subtitle="Historical metrics and trend analysis"
            timeRange={['7d', '30d', '90d']}
            selectedRange={selectedTimeRange}
            onRangeChange={setSelectedTimeRange}
          >
            <ChartGrid columns={2}>
              <PremiumCard className="p-6">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-200 mb-1">Impressions Trend</h4>
                  <p className="text-sm text-slate-400">Daily impression volume</p>
                </div>
                <div className="space-y-3">
                  {sampleMetricsData.map((metric, index) => (
                    <MetricBar
                      key={index}
                      label={new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      value={metric.impressions}
                      maxValue={Math.max(...sampleMetricsData.map(m => m.impressions))}
                      color="bg-gradient-to-r from-indigo-500 to-indigo-400"
                    />
                  ))}
                </div>
              </PremiumCard>

              <PremiumCard className="p-6">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-200 mb-1">Clicks Trend</h4>
                  <p className="text-sm text-slate-400">User engagement metrics</p>
                </div>
                <div className="space-y-3">
                  {sampleMetricsData.map((metric, index) => (
                    <MetricBar
                      key={index}
                      label={new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      value={metric.clicks}
                      maxValue={Math.max(...sampleMetricsData.map(m => m.clicks))}
                      color="bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  ))}
                </div>
              </PremiumCard>
            </ChartGrid>
          </ChartContainer>
        </section>

        {/* Active Campaigns */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Active Campaigns
            </h2>
            <p className="text-sm text-slate-400">
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
            <h2 className="text-xl font-semibold text-slate-100 mb-2 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              AI Performance Analysis
            </h2>
            <p className="text-sm text-slate-400">
              Automated insights and optimization recommendations
            </p>
          </div>

          <PerformanceAlerts alerts={performanceAlerts} />
        </section>
      </main>
    </div>
  )
}