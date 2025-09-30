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
            >
              <Play className="w-5 h-5" />
              Start Analysis
            </Button>
          )
        }
      />

      <div className="p-6 space-y-8">
        {/* Upload Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Upload Data Artifacts
            </h2>
            <p className="text-gray-400">
              Upload sales data, customer reviews, marketing documents, and images for AI analysis
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
          <section>
            <Card variant="holo">
              <CardContent className="p-6">
                <div className="text-center">
                  {isAnalyzing ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">
                        Analyzing Data Artifacts
                      </h3>
                      <p className="text-electric-500 font-mono text-sm">
                        AI agents extracting features and generating insights...
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Ready for Analysis
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Data artifacts uploaded. Analysis will start automatically or click the button above.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Analysis Snapshot */}
        {analysisSnapshot && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">
                Analysis Results
              </h2>
              <p className="text-gray-400">
                AI-generated insights from your uploaded data artifacts
              </p>
            </div>
            <AnalysisSnapshot snapshot={analysisSnapshot} />
          </section>
        )}

        {/* Error Display */}
        {error && (
          <section>
            <Card variant="default" className="border-red-500 bg-red-500/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-400">Analysis Error</h3>
                    <p className="text-sm text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Empty State */}
        {!hasUploadedFiles && !analysisSnapshot && (
          <section className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-space-200 flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Ready for Mission Launch
              </h3>
              <p className="text-gray-400">
                Upload your marketing data artifacts to begin AI-powered analysis and strategy generation.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
