'use client'

import { useState, useEffect } from 'react'
import { Rocket, Play } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { FileUploader } from '@/components/workspace/FileUploader'
import { AnalysisSnapshot } from '@/components/workspace/AnalysisSnapshot'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { PremiumCard } from '@/components/ui/PremiumCard'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useWorkspaceData } from '@/hooks/useLLMData'
import { supabase } from '@/lib/supabase'

export default function WorkspacePage() {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{id: string; status: string}>>([])
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false)
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
        const { data: files, error } = await supabase
          .from('artifacts')
          .select('artifact_id')
          .eq('project_id', projectId)

        if (!error && files && files.length > 0) {
          setHasUploadedFiles(true)

          // Update uploaded files count for display
          setUploadedFiles(files.map((file: {artifact_id: string}) => ({
            id: file.artifact_id,
            status: 'success'
          })))
        } else {
          setHasUploadedFiles(false)
        }
      } catch (error) {
        console.warn('Could not check for uploaded files:', error)
        setHasUploadedFiles(false)
      }
    }

    checkUploadedFiles()
  }, [projectId])

  const handleUploadComplete = (files: Array<{id: string; status: string}>) => {
    // Use setTimeout to defer state updates to avoid rendering conflicts
    setTimeout(() => {
      setUploadedFiles(files)
      if (files.length > 0) {
        setHasUploadedFiles(true)
      }
    }, 0)
  }

  // Separate effect to handle analysis triggering
  useEffect(() => {
    if (uploadedFiles.length > 0 && !analysisSnapshot && !isAnalyzing && hasUploadedFiles) {
      const triggerAnalysis = setTimeout(async () => {
        await analyzeFiles()
      }, 1000) // Small delay to show upload completion

      return () => clearTimeout(triggerAnalysis)
    }
  }, [uploadedFiles.length, analysisSnapshot, isAnalyzing, hasUploadedFiles, analyzeFiles])

  const startAnalysis = async () => {
    await analyzeFiles()
  }

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

            {hasUploadedFiles && !analysisSnapshot && !isAnalyzing && (
              <PremiumButton
                variant="primary"
                size="lg"
                onClick={startAnalysis}
                icon={<Play className="w-5 h-5" />}
              >
                Start Analysis
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
            maxFiles={10}
            acceptedFileTypes={['.csv', '.json', '.pdf', '.png', '.jpg', '.jpeg']}
            projectId={projectId}
          />
        </section>

        {/* Analysis Status */}
        {hasUploadedFiles && !analysisSnapshot && (
          <section className="max-w-2xl mx-auto">
            <PremiumCard variant="elevated" className="p-8">
              <div className="text-center">
                {isAnalyzing ? (
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-slate-100">
                        Analyzing Data Artifacts
                      </h3>
                      <p className="text-base font-mono text-indigo-400">
                        AI agents extracting features and generating insights...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-100">
                      Ready for Analysis
                    </h3>
                    <p className="text-base leading-relaxed text-slate-400">
                      Data artifacts uploaded successfully. Analysis will start automatically or click the button above.
                    </p>
                  </div>
                )}
              </div>
            </PremiumCard>
          </section>
        )}

        {/* Analysis Snapshot */}
        {analysisSnapshot && (
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
