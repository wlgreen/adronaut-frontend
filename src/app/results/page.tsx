'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, Zap, DollarSign, Users, MousePointer, Eye } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CampaignCard } from '@/components/results/CampaignCard'
import { MetricsChart } from '@/components/results/MetricsChart'
import { PerformanceAlerts } from '@/components/results/PerformanceAlerts'

// Sample campaign data
const sampleCampaigns = [
  {
    campaign_id: "camp_001",
    name: "Tech-Savvy Professionals Q4",
    status: "running" as const,
    start_date: "2024-09-25T00:00:00Z",
    strategy_version: 2,
    platforms: ["facebook", "google_ads", "linkedin"],
    current_metrics: {
      impressions: 245780,
      clicks: 8936,
      conversions: 287,
      spend: 4250.50,
      revenue: 18975.30
    },
    performance_indicators: {
      ctr: 3.64,
      cpa: 14.81,
      roas: 4.46,
      conversion_rate: 3.21
    }
  },
  {
    campaign_id: "camp_002",
    name: "Budget-Conscious Families",
    status: "completed" as const,
    start_date: "2024-09-20T00:00:00Z",
    strategy_version: 1,
    platforms: ["facebook", "google_ads"],
    current_metrics: {
      impressions: 189340,
      clicks: 5247,
      conversions: 156,
      spend: 2890.75,
      revenue: 8734.20
    },
    performance_indicators: {
      ctr: 2.77,
      cpa: 18.53,
      roas: 3.02,
      conversion_rate: 2.97
    }
  }
]

// Sample performance alerts
const sampleAlerts = [
  {
    id: "alert_001",
    type: "optimization" as const,
    severity: "medium" as const,
    title: "CPA Above Target",
    description: "Campaign 'Tech-Savvy Professionals Q4' has CPA 15% above target threshold",
    recommendation: "Consider tightening audience targeting or adjusting bidding strategy",
    created_at: "2024-09-28T14:30:00Z"
  },
  {
    id: "alert_002",
    type: "opportunity" as const,
    severity: "low" as const,
    title: "Strong Performance Detected",
    description: "LinkedIn channel showing 40% higher ROAS than other channels",
    recommendation: "Consider reallocating budget to maximize LinkedIn performance",
    created_at: "2024-09-28T12:15:00Z"
  }
]

// Sample metrics time series data
const sampleMetricsData = [
  { date: '2024-09-25', impressions: 45200, clicks: 1630, conversions: 52, spend: 850 },
  { date: '2024-09-26', impressions: 48900, clicks: 1789, conversions: 58, spend: 875 },
  { date: '2024-09-27', impressions: 52100, clicks: 1945, conversions: 63, spend: 920 },
  { date: '2024-09-28', impressions: 49580, clicks: 1872, conversions: 61, spend: 905 },
]

export default function ResultsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)

  const totalMetrics = sampleCampaigns.reduce((total, campaign) => ({
    impressions: total.impressions + campaign.current_metrics.impressions,
    clicks: total.clicks + campaign.current_metrics.clicks,
    conversions: total.conversions + campaign.current_metrics.conversions,
    spend: total.spend + campaign.current_metrics.spend,
    revenue: total.revenue + campaign.current_metrics.revenue
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 })

  const avgMetrics = {
    ctr: ((totalMetrics.clicks / totalMetrics.impressions) * 100),
    cpa: totalMetrics.spend / totalMetrics.conversions,
    roas: totalMetrics.revenue / totalMetrics.spend,
    conversion_rate: ((totalMetrics.conversions / totalMetrics.clicks) * 100)
  }

  return (
    <div>
      <PageHeader
        title="Results"
        description="TELEMETRY DASHBOARD • PERFORMANCE ANALYSIS • REAL-TIME METRICS"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="success" glow>
              {sampleCampaigns.filter(c => c.status === 'running').length} Active Campaigns
            </Badge>
            <Button variant="primary" size="sm">
              <TrendingUp className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-8">
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
            data={sampleMetricsData}
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
            {sampleCampaigns.map((campaign) => (
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

          <PerformanceAlerts alerts={sampleAlerts} />
        </section>
      </div>
    </div>
  )
}