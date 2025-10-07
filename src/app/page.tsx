'use client'

import { useState, useEffect, useCallback } from 'react'
import { Rocket, Play } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { FileUploader } from '@/components/workspace/FileUploader'
import { AnalysisSnapshot } from '@/components/workspace/AnalysisSnapshot'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { PremiumCard } from '@/components/ui/PremiumCard'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useWorkspaceData } from '@/hooks/useLLMData'
import { supabase } from '@/lib/supabase'
import { supabaseLogger } from '@/lib/supabase-logger'

export default function WorkspacePage() {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: string; status: string}>>([])
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false)
  const [artifacts, setArtifacts] = useState<Array<{
    artifact_id: string
    filename: string
    file_size: number
    created_at: string
  }>>([])
  const [artifactsLoading, setArtifactsLoading] = useState(false)
  const [projectId, setProjectId] = useState<string>(() => {
    // Generate or retrieve project ID
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
    analysisSnapshot,
    isAnalyzing,
    error,
    currentStep,
    analyzeFiles
  } = useWorkspaceData(projectId)

  // Check for uploaded files - now enabled for database use
  useEffect(() => {
    const isDevelopmentMode = false // Database is now ready with tables created

    if (isDevelopmentMode) {
      // In development mode, don't check database
      return
    }

    const checkUploadedFiles = async () => {
      try {
        setArtifactsLoading(true)

        // Use supabaseLogger to query artifacts with full details
        const result = await supabaseLogger.select('artifacts', {
          select: 'artifact_id, filename, file_size, created_at, project_id',
          eq: { project_id: projectId },
          orderBy: { column: 'created_at', ascending: false }
        })

        if (result.data && result.data.length > 0) {
          setHasUploadedFiles(true)
          setArtifacts(result.data)

          // Update uploaded files count for display
          setUploadedFiles(result.data.map((file: any) => ({
            id: file.artifact_id,
            status: 'success'
          })))
        } else {
          setHasUploadedFiles(false)
          setArtifacts([])
          setUploadedFiles([])
        }
      } catch (error) {
        console.warn('Could not check for uploaded files:', error)
        setHasUploadedFiles(false)
        setArtifacts([])
      } finally {
        setArtifactsLoading(false)
      }
    }

    checkUploadedFiles()
  }, [projectId])

  const handleUploadComplete = useCallback(async (files: Array<{id: string; status: string}>) => {
    // Optimistic update: immediately mark as uploaded to prevent blinking
    setHasUploadedFiles(true)
    setUploadedFiles(files)

    // Refresh artifacts list in background without showing loading state
    try {
      const result = await supabaseLogger.select('artifacts', {
        select: 'artifact_id, filename, file_size, created_at, project_id',
        eq: { project_id: projectId },
        orderBy: { column: 'created_at', ascending: false }
      })

      if (result.data && result.data.length > 0) {
        setArtifacts(result.data)
      }
    } catch (error) {
      console.warn('Could not refresh artifacts after upload:', error)
    }
  }, [projectId])

  const handleProjectIdUpdate = (newProjectId: string) => {
    setProjectId(newProjectId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('adronaut_project_id', newProjectId)
    }
  }

  // Auto-analysis removed - now manual only via button

  const startAnalysis = async () => {
    console.log('🎯 [startAnalysis] Button clicked! Starting analysis flow...')
    console.log('🎯 [startAnalysis] Current state:', {
      projectId,
      hasUploadedFiles,
      isAnalyzing,
      analysisSnapshot: !!analysisSnapshot
    })

    try {
      console.log('🎯 [startAnalysis] Calling analyzeFiles()...')
      await analyzeFiles()
      console.log('🎯 [startAnalysis] analyzeFiles() completed successfully')
    } catch (error) {
      console.error('🎯 [startAnalysis] Error in analyzeFiles():', error)
    }
  }

  // Safety: Reset analyzing state if snapshot loads (e.g., from cache/refresh)
  useEffect(() => {
    console.log('📊 [Workspace] State changed:', {
      hasUploadedFiles,
      analysisSnapshot: !!analysisSnapshot,
      isAnalyzing,
      error: !!error
    })

    if (analysisSnapshot && isAnalyzing) {
      console.log('⚠️ [Workspace] Analysis snapshot loaded but isAnalyzing=true, resetting state')
      // The hook should have already reset this, but this is a safety net
    }
  }, [analysisSnapshot, isAnalyzing, hasUploadedFiles, error])

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="w-6 h-6 text-indigo-400" />
              <div>
                <h1 className="text-2xl font-bold text-slate-100">Workspace</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Data ingestion • Feature extraction • Analysis
                </p>
              </div>
            </div>

            {hasUploadedFiles && !isAnalyzing && (
              <PremiumButton
                variant="primary"
                size="lg"
                onClick={startAnalysis}
                icon={<Play className="w-5 h-5" />}
              >
                Analyze
              </PremiumButton>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Section */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-100 mb-4">
              Upload Data Artifacts
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Upload sales data, customer reviews, marketing documents, and images for comprehensive AI analysis
            </p>
          </div>

          <FileUploader
            onUploadComplete={handleUploadComplete}
            onProjectIdUpdate={handleProjectIdUpdate}
            maxFiles={10}
            acceptedFileTypes={['.csv', '.json', '.pdf', '.png', '.jpg', '.jpeg']}
            projectId={projectId}
          />
        </section>

        {/* Existing Artifacts */}
        {artifacts.length > 0 && (
          <section className="space-y-6">
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-slate-100 mb-2">
                Uploaded Artifacts ({artifacts.length})
              </h3>
              <p className="text-base text-slate-400">
                Previously uploaded files available for analysis
              </p>
            </div>

            <PremiumCard variant="elevated" className="max-w-4xl mx-auto">
              <div className="p-6">
                {artifactsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400">Loading artifacts...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {artifacts.map((artifact) => (
                      <div key={artifact.artifact_id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <div className="flex-1">
                          <h4 className="text-slate-100 font-medium">{artifact.filename}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                            <span>{(artifact.file_size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{new Date(artifact.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open(`${process.env.NEXT_PUBLIC_AUTOGEN_SERVICE_URL}/artifact/${artifact.artifact_id}/download`, '_blank')}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PremiumCard>
          </section>
        )}

        {/* Analysis Status */}
        {hasUploadedFiles && (
          <section className="max-w-2xl mx-auto">
            {isAnalyzing ? (
              <PremiumCard variant="elevated" className="p-8">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-slate-100">
                      Analyzing Data Artifacts
                    </h3>
                    <p className="text-base font-mono text-indigo-400">
                      {currentStep || 'AI agents extracting features and generating insights...'}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            ) : !analysisSnapshot && (
              <PremiumCard variant="elevated" className="p-8">
                <div className="text-center space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-2">
                      Ready for Analysis
                    </h3>
                    <p className="text-base leading-relaxed text-slate-400">
                      Data artifacts uploaded successfully. Click the button to start AI analysis.
                    </p>
                  </div>
                  <PremiumButton
                    onClick={startAnalysis}
                    className="w-full sm:w-auto mx-auto"
                    disabled={isAnalyzing}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Analyze
                  </PremiumButton>
                </div>
              </PremiumCard>
            )}
          </section>
        )}

        {/* Analysis Snapshot */}
        {analysisSnapshot && !isAnalyzing && (
          <section className="space-y-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-100 mb-4">
                Analysis Results
              </h2>
              <p className="text-lg leading-relaxed text-slate-400">
                AI-generated insights and recommendations from your uploaded data artifacts
              </p>
            </div>
            <PremiumCard variant="elevated">
              <AnalysisSnapshot snapshot={analysisSnapshot} />
            </PremiumCard>
          </section>
        )}

        {/* Error Display */}
        {error && (
          <section className="max-w-4xl mx-auto">
            <ErrorDisplay
              error={error}
              context="analysis"
              onRetry={hasUploadedFiles ? startAnalysis : undefined}
              retryLabel="Retry Analysis"
              isRetrying={isAnalyzing}
            />
          </section>
        )}

        {/* Empty State */}
        {!hasUploadedFiles && !analysisSnapshot && (
          <section className="text-center py-16">
            <div className="max-w-lg mx-auto">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 bg-gradient-to-br from-slate-800 to-slate-700 shadow-xl">
                <Rocket className="w-12 h-12 text-indigo-400" />
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-100">
                  Ready for Mission Launch
                </h3>
                <p className="text-base leading-relaxed max-w-md mx-auto text-slate-400">
                  Upload your marketing data artifacts to begin AI-powered analysis and strategy generation.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
