'use client'

import { useState, useEffect } from 'react'
import { Rocket, Play } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { FileUploader } from '@/components/workspace/FileUploader'
import { AnalysisSnapshot } from '@/components/workspace/AnalysisSnapshot'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useWorkspaceData } from '@/hooks/useLLMData'
import { supabase } from '@/lib/supabase'

export default function WorkspacePage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [hasUploadedFiles, setHasUploadedFiles] = useState(false)
  const [projectId, setProjectId] = useState<string>(() => {
    // Generate or retrieve project ID
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adronaut_project_id')
      if (saved) return saved

      const newId = `proj_${Date.now()}`
      localStorage.setItem('adronaut_project_id', newId)
      return newId
    }
    return `proj_${Date.now()}`
  })

  const {
    analysisSnapshot,
    isAnalyzing,
    error,
    analyzeFiles
  } = useWorkspaceData(projectId)

  // Check for uploaded files - skip in development mode
  useEffect(() => {
    const isDevelopmentMode = true // TODO: Set to false when Supabase is ready

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
          setUploadedFiles(files.map((file, index) => ({
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

  const handleUploadComplete = (files: any[]) => {
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
    <div>
      <PageHeader
        title="Workspace"
        description="DATA INGESTION • FEATURE EXTRACTION • ANALYSIS"
        icon={Rocket}
        actions={
          hasUploadedFiles && !analysisSnapshot && !isAnalyzing && (
            <Button
              variant="primary"
              size="lg"
              glow
              onClick={startAnalysis}
              className="btn-hover-lift"
            >
              <Play className="w-5 h-5" />
              Start Analysis
            </Button>
          )
        }
      />

      <div className="p-8 space-y-12 max-w-7xl mx-auto">
        {/* Upload Section */}
        <section className="space-y-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="heading-xl text-white mb-4">
              Upload Data Artifacts
            </h2>
            <p className="body-lg" style={{ color: 'var(--space-300)' }}>
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
            <div className="card-workspace">
              <div className="p-8">
                <div className="text-center">
                  {isAnalyzing ? (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 border-3 border-electric-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="heading-lg" style={{ color: 'var(--foreground)' }}>
                          Analyzing Data Artifacts
                        </h3>
                        <p className="body-md font-mono" style={{ color: 'var(--electric)' }}>
                          AI agents extracting features and generating insights...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="heading-md" style={{ color: 'var(--foreground)' }}>
                        Ready for Analysis
                      </h3>
                      <p className="body-md leading-relaxed" style={{ color: 'var(--space-300)' }}>
                        Data artifacts uploaded successfully. Analysis will start automatically or click the button above.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Analysis Snapshot */}
        {analysisSnapshot && (
          <section className="space-y-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="heading-xl mb-4" style={{ color: 'var(--foreground)' }}>
                Analysis Results
              </h2>
              <p className="body-lg leading-relaxed" style={{ color: 'var(--space-300)' }}>
                AI-generated insights and recommendations from your uploaded data artifacts
              </p>
            </div>
            <div className="card-analysis">
              <AnalysisSnapshot snapshot={analysisSnapshot} />
            </div>
          </section>
        )}

        {/* Error Display */}
        {error && (
          <section className="max-w-2xl mx-auto">
            <div className="card-workspace border-neon-rose bg-neon-rose/10">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--neon-rose)', opacity: 0.2 }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--neon-rose)' }} />
                  </div>
                  <div>
                    <h3 className="heading-sm mb-2" style={{ color: 'var(--neon-rose)' }}>Analysis Error</h3>
                    <p className="body-sm leading-relaxed" style={{ color: 'var(--error)' }}>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Empty State */}
        {!hasUploadedFiles && !analysisSnapshot && (
          <section className="text-center py-16">
            <div className="max-w-lg mx-auto">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-card-elevated" style={{ background: 'linear-gradient(135deg, var(--space-200), var(--space-300))' }}>
                <Rocket className="w-12 h-12" style={{ color: 'var(--electric)' }} />
              </div>
              <div className="space-y-4">
                <h3 className="heading-lg" style={{ color: 'var(--foreground)' }}>
                  Ready for Mission Launch
                </h3>
                <p className="body-md leading-relaxed max-w-md mx-auto" style={{ color: 'var(--space-300)' }}>
                  Upload your marketing data artifacts to begin AI-powered analysis and strategy generation.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
