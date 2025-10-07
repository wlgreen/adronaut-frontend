import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { llmService, AnalysisSnapshot, Strategy, StrategyPatch, Campaign, PerformanceAlert } from '@/lib/llm-service'
import { supabaseLogger } from '@/lib/supabase-logger'
import { logger } from '@/lib/logger'

export function useWorkspaceData(projectId?: string) {
  const [analysisSnapshot, setAnalysisSnapshot] = useState<AnalysisSnapshot | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeFiles = useCallback(async () => {
    if (!projectId) return

    console.log('🚀 [analyzeFiles] Starting analysis', { projectId })
    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('📡 [analyzeFiles] Calling llmService.analyzeUploadedFiles')
      const snapshot = await llmService.analyzeUploadedFiles(projectId)
      console.log('✅ [analyzeFiles] Analysis completed, snapshot received:', {
        hasAudienceSegments: !!snapshot.audience_segments,
        hasRecommendations: !!snapshot.recommendations,
        segmentCount: snapshot.audience_segments?.length
      })

      setAnalysisSnapshot(snapshot)
      console.log('📊 [analyzeFiles] Snapshot state updated')

      // Save to Supabase
      await supabaseLogger.upsert('analysis_snapshots', {
        project_id: projectId,
        snapshot_data: snapshot,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'project_id'
      })
      console.log('💾 [analyzeFiles] Snapshot saved to Supabase')
    } catch (err) {
      console.error('❌ [analyzeFiles] Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      console.log('🏁 [analyzeFiles] Setting isAnalyzing to false')
      setIsAnalyzing(false)
    }
  }, [projectId])

  // Load existing analysis on mount
  useEffect(() => {
    if (!projectId) return

    const loadExistingAnalysis = async () => {
      try {
        const result = await supabaseLogger.select('analysis_snapshots', {
          select: '*',
          eq: { project_id: projectId },
          orderBy: { column: 'created_at', ascending: false },
          limit: 1
        })

        if (result.data && result.data.length > 0) {
          const snapshotData = result.data[0].snapshot_data
          console.log('📊 Loaded existing analysis:', snapshotData)
          setAnalysisSnapshot(snapshotData)

          // Reset analyzing state if we have existing data
          setIsAnalyzing(false)
        } else {
          // No existing analysis found
          setAnalysisSnapshot(null)
          setIsAnalyzing(false)
        }
      } catch (error) {
        logger.warn('Failed to load existing analysis', {
          projectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        // Reset analyzing state on error
        setIsAnalyzing(false)
      }
    }

    loadExistingAnalysis()
  }, [projectId])

  return {
    analysisSnapshot,
    isAnalyzing,
    error,
    analyzeFiles
  }
}

export function useStrategyData(projectId?: string) {
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null)
  const [pendingPatches, setPendingPatches] = useState<StrategyPatch[]>([])
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false)
  const [isGeneratingPatches, setIsGeneratingPatches] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateStrategy = useCallback(async (analysisSnapshot: AnalysisSnapshot) => {
    if (!projectId) return

    setIsGeneratingStrategy(true)
    setError(null)

    try {
      const strategy = await llmService.generateStrategy(analysisSnapshot, projectId)
      setActiveStrategy(strategy)

      // Save to Supabase
      await supabaseLogger.upsert('strategies', {
        project_id: projectId,
        strategy_id: strategy.strategy_id,
        version: strategy.version,
        strategy_data: strategy,
        created_at: strategy.created_at
      }, {
        onConflict: 'strategy_id'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Strategy generation failed')
    } finally {
      setIsGeneratingStrategy(false)
    }
  }, [projectId])

  const generatePatches = useCallback(async (performanceData: any[]) => {
    if (!activeStrategy) return

    setIsGeneratingPatches(true)
    setError(null)

    try {
      const patches = await llmService.generateStrategyPatches(activeStrategy, performanceData)
      setPendingPatches(prev => [...prev, ...patches])

      // Save patches to Supabase
      for (const patch of patches) {
        await supabaseLogger.insert('strategy_patches', {
          project_id: projectId,
          patch_id: patch.patch_id,
          strategy_id: activeStrategy.strategy_id,
          source: patch.source,
          status: patch.status,
          patch_data: patch.patch_json,
          justification: patch.justification,
          created_at: patch.created_at
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Patch generation failed')
    } finally {
      setIsGeneratingPatches(false)
    }
  }, [activeStrategy, projectId])

  const applyPatch = useCallback(async (patchId: string, action: 'approve' | 'reject') => {
    const patch = pendingPatches.find(p => p.patch_id === patchId)
    if (!patch || !activeStrategy) return

    try {
      if (action === 'approve') {
        // Create new strategy version with patch applied
        const newStrategy: Strategy = {
          ...activeStrategy,
          ...patch.patch_json,
          version: activeStrategy.version + 1,
          created_at: new Date().toISOString(),
          strategy_id: uuidv4()
        }

        setActiveStrategy(newStrategy)

        // Save new strategy version
        await supabaseLogger.insert('strategies', {
          project_id: projectId,
          strategy_id: newStrategy.strategy_id,
          version: newStrategy.version,
          strategy_data: newStrategy,
          created_at: newStrategy.created_at
        })
      }

      // Update patch status
      await supabaseLogger.update('strategy_patches',
        { status: action === 'approve' ? 'approved' : 'rejected' },
        { eq: { patch_id: patchId } }
      )

      // Remove from pending
      setPendingPatches(prev => prev.filter(p => p.patch_id !== patchId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply patch')
    }
  }, [pendingPatches, activeStrategy, projectId])

  // Load existing strategy and patches on mount
  useEffect(() => {
    if (!projectId) return

    const loadStrategyData = async () => {
      // Load latest strategy
      const result = await supabaseLogger.select('strategies', {
        select: '*',
        eq: { project_id: projectId },
        orderBy: { column: 'version', ascending: false },
        limit: 1
      })

      const strategyData = result.data && result.data.length > 0 ? result.data[0] : null

      if (strategyData) {
        setActiveStrategy(strategyData.strategy_data)
      }

      // Load pending patches
      const patchesResult = await supabaseLogger.select('strategy_patches', {
        select: '*',
        eq: { project_id: projectId, status: 'proposed' },
        orderBy: { column: 'created_at', ascending: false }
      })

      const patchesData = patchesResult.data

      if (patchesData) {
        const patches: StrategyPatch[] = patchesData.map(p => ({
          patch_id: p.patch_id,
          source: p.source,
          status: p.status,
          patch_json: p.patch_data,
          justification: p.justification,
          created_at: p.created_at
        }))
        setPendingPatches(patches)
      }
    }

    loadStrategyData()
  }, [projectId])

  return {
    activeStrategy,
    pendingPatches,
    isGeneratingStrategy,
    isGeneratingPatches,
    error,
    generateStrategy,
    generatePatches,
    applyPatch
  }
}

export function useResultsData(projectId?: string) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([])
  const [metricsData, setMetricsData] = useState<any[]>([])
  const [isAnalyzingPerformance, setIsAnalyzingPerformance] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzePerformance = useCallback(async () => {
    if (!campaigns.length) return

    setIsAnalyzingPerformance(true)
    setError(null)

    try {
      const alerts = await llmService.analyzePerformance(campaigns)
      setPerformanceAlerts(alerts)

      // Save alerts to Supabase
      for (const alert of alerts) {
        await supabaseLogger.insert('performance_alerts', {
          project_id: projectId,
          alert_id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          recommendation: alert.recommendation,
          created_at: alert.created_at
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Performance analysis failed')
    } finally {
      setIsAnalyzingPerformance(false)
    }
  }, [campaigns, projectId])

  // Load campaign data and metrics
  useEffect(() => {
    if (!projectId) return

    const loadResultsData = async () => {
      // Load campaigns
      const campaignResult = await supabaseLogger.select('campaigns', {
        select: '*',
        eq: { project_id: projectId },
        orderBy: { column: 'created_at', ascending: false }
      })
      const campaignData = campaignResult.data

      if (campaignData) {
        const campaigns: Campaign[] = campaignData.map(c => ({
          campaign_id: c.campaign_id,
          name: c.name,
          status: c.status,
          start_date: c.start_date,
          strategy_version: c.strategy_version,
          platforms: c.platforms,
          current_metrics: c.current_metrics,
          performance_indicators: c.performance_indicators
        }))
        setCampaigns(campaigns)
      }

      // Load performance alerts
      const alertsResult = await supabaseLogger.select('performance_alerts', {
        select: '*',
        eq: { project_id: projectId },
        orderBy: { column: 'created_at', ascending: false },
        limit: 10
      })
      const alertsData = alertsResult.data

      if (alertsData) {
        const alerts: PerformanceAlert[] = alertsData.map(a => ({
          id: a.alert_id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          description: a.description,
          recommendation: a.recommendation,
          created_at: a.created_at
        }))
        setPerformanceAlerts(alerts)
      }

      // Load metrics time series
      const metricsResult = await supabaseLogger.select('campaign_metrics', {
        select: '*',
        eq: { project_id: projectId },
        orderBy: { column: 'date', ascending: true }
      })
      const metricsData = metricsResult.data

      if (metricsData) {
        setMetricsData(metricsData)
      }
    }

    loadResultsData()
  }, [projectId])

  return {
    campaigns,
    performanceAlerts,
    metricsData,
    isAnalyzingPerformance,
    error,
    analyzePerformance
  }
}