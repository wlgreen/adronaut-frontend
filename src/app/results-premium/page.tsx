'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Eye, MousePointer, DollarSign, Users } from 'lucide-react'
import { PremiumCard, MetricCard } from '@/components/ui/PremiumCard'
import { PremiumButton, ButtonGroup } from '@/components/ui/PremiumButton'
import { ChartContainer, MetricBar, TrendLine, ChartGrid } from '@/components/charts/PremiumChart'
import { Badge } from '@/components/ui/Badge'

// Sample data for demonstration
const sampleMetrics = [
  { date: '2024-09-25', impressions: 45200, clicks: 1630, conversions: 52, spend: 850 },
  { date: '2024-09-26', impressions: 48900, clicks: 1789, conversions: 58, spend: 875 },
  { date: '2024-09-27', impressions: 52100, clicks: 1945, conversions: 63, spend: 920 },
  { date: '2024-09-28', impressions: 49580, clicks: 1872, conversions: 61, spend: 905 },
]

export default function PremiumResultsPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d')

  const totalImpressions = sampleMetrics.reduce((sum, d) => sum + d.impressions, 0)
  const totalClicks = sampleMetrics.reduce((sum, d) => sum + d.clicks, 0)
  const totalConversions = sampleMetrics.reduce((sum, d) => sum + d.conversions, 0)
  const totalSpend = sampleMetrics.reduce((sum, d) => sum + d.spend, 0)

  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0
  const cpa = totalConversions > 0 ? (totalSpend / totalConversions) : 0
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100) : 0

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Results Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">
                Real-time campaign performance and analytics
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                6 Active Campaigns
              </Badge>
              <ButtonGroup>
                <PremiumButton variant="secondary" size="sm">
                  <TrendingUp className="w-4 h-4" />
                  Export Report
                </PremiumButton>
                <PremiumButton variant="primary" size="sm">
                  Create Campaign
                </PremiumButton>
              </ButtonGroup>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics Overview */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Performance Overview</h2>
            <p className="text-sm text-slate-400">Real-time campaign metrics and key performance indicators</p>
          </div>

          <ChartGrid columns={4}>
            <MetricCard
              title="Total Impressions"
              value={totalImpressions.toLocaleString()}
              change="+12.5%"
              changeType="positive"
              icon={<Eye />}
              subtitle="Last 7 days"
            />
            <MetricCard
              title="Click-Through Rate"
              value={`${ctr.toFixed(2)}%`}
              change="+0.3%"
              changeType="positive"
              icon={<MousePointer />}
              subtitle="Above industry avg"
            />
            <MetricCard
              title="Cost per Acquisition"
              value={`$${cpa.toFixed(2)}`}
              change="-5.2%"
              changeType="positive"
              icon={<DollarSign />}
              subtitle="Efficiency improved"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${conversionRate.toFixed(2)}%`}
              change="+1.8%"
              changeType="positive"
              icon={<Users />}
              subtitle="Strong performance"
            />
          </ChartGrid>
        </section>

        {/* Performance Trends */}
        <section>
          <ChartContainer
            title="Performance Trends"
            subtitle="Historical metrics and trend analysis"
            timeRange={['7d', '30d', '90d']}
            selectedRange={selectedTimeRange}
            onRangeChange={setSelectedTimeRange}
          >
            <ChartGrid columns={2}>
              {/* Impressions Chart */}
              <PremiumCard className="p-6">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-200 mb-1">Impressions</h4>
                  <p className="text-sm text-slate-400">Daily impression volume</p>
                </div>

                <div className="mb-4">
                  <TrendLine
                    data={sampleMetrics.map(d => ({ date: d.date, value: d.impressions }))}
                    color="stroke-indigo-400"
                    height={120}
                    showDots
                  />
                </div>

                <div className="space-y-3">
                  {sampleMetrics.map((metric, index) => (
                    <MetricBar
                      key={index}
                      label={new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      value={metric.impressions}
                      maxValue={Math.max(...sampleMetrics.map(m => m.impressions))}
                      color="bg-gradient-to-r from-indigo-500 to-indigo-400"
                    />
                  ))}
                </div>
              </PremiumCard>

              {/* Clicks Chart */}
              <PremiumCard className="p-6">
                <div className="mb-4">
                  <h4 className="text-base font-semibold text-slate-200 mb-1">Clicks</h4>
                  <p className="text-sm text-slate-400">User engagement metrics</p>
                </div>

                <div className="mb-4">
                  <TrendLine
                    data={sampleMetrics.map(d => ({ date: d.date, value: d.clicks }))}
                    color="stroke-emerald-400"
                    height={120}
                    showDots
                  />
                </div>

                <div className="space-y-3">
                  {sampleMetrics.map((metric, index) => (
                    <MetricBar
                      key={index}
                      label={new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      value={metric.clicks}
                      maxValue={Math.max(...sampleMetrics.map(m => m.clicks))}
                      color="bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  ))}
                </div>
              </PremiumCard>
            </ChartGrid>
          </ChartContainer>
        </section>

        {/* Campaign Performance */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Active Campaigns</h2>
            <p className="text-sm text-slate-400">Individual campaign performance and status</p>
          </div>

          <ChartGrid columns={1}>
            <PremiumCard className="p-6">
              <div className="space-y-6">
                {/* Campaign 1 */}
                <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                    <div>
                      <h4 className="font-semibold text-slate-200">Tech Professionals Campaign</h4>
                      <p className="text-sm text-slate-400">Social Media • Search Ads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">CTR</p>
                      <p className="font-mono text-lg font-bold text-emerald-400">3.7%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">CPA</p>
                      <p className="font-mono text-lg font-bold text-slate-200">$15.17</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">ROAS</p>
                      <p className="font-mono text-lg font-bold text-emerald-400">4.2x</p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>

                {/* Campaign 2 */}
                <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-amber-400 rounded-full" />
                    <div>
                      <h4 className="font-semibold text-slate-200">Budget-Conscious Families</h4>
                      <p className="text-sm text-slate-400">Content Marketing • Email</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">CTR</p>
                      <p className="font-mono text-lg font-bold text-slate-200">2.1%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">CPA</p>
                      <p className="font-mono text-lg font-bold text-slate-200">$8.45</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">ROAS</p>
                      <p className="font-mono text-lg font-bold text-slate-200">3.1x</p>
                    </div>
                    <Badge variant="warning">Optimizing</Badge>
                  </div>
                </div>
              </div>
            </PremiumCard>
          </ChartGrid>
        </section>

        {/* AI Insights */}
        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100 mb-2">AI Performance Analysis</h2>
            <p className="text-sm text-slate-400">Automated insights and optimization recommendations</p>
          </div>

          <PremiumCard variant="elevated" className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-200 mb-2">All Systems Optimal</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  No performance issues detected. All campaigns are running within target parameters.
                  The Tech Professionals segment is showing strong engagement with mobile-first creative strategies.
                </p>
              </div>
            </div>
          </PremiumCard>
        </section>
      </main>
    </div>
  )
}