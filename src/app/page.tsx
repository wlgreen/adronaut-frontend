'use client'

import { useState } from 'react'
import { Rocket, Play } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { FileUploader } from '@/components/workspace/FileUploader'
import { AnalysisSnapshot } from '@/components/workspace/AnalysisSnapshot'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

// Sample data for demo
const sampleSnapshot = {
  audience_segments: [
    {
      name: "Tech-Savvy Professionals",
      characteristics: ["early_adopters", "high_income", "urban"],
      size_estimate: "35%",
      value_score: 8
    },
    {
      name: "Budget-Conscious Families",
      characteristics: ["price_sensitive", "suburban", "family_oriented"],
      size_estimate: "45%",
      value_score: 6
    }
  ],
  content_themes: [
    {
      theme: "Innovation & Technology",
      performance: "high" as const,
      keywords: ["AI", "innovation", "future", "smart"]
    },
    {
      theme: "Value & Savings",
      performance: "medium" as const,
      keywords: ["save", "discount", "affordable", "value"]
    }
  ],
  performance_metrics: {
    conversion_rate: "3.2%",
    engagement_rate: "7.8%",
    cost_per_acquisition: "$24",
    roi: "425%"
  },
  geographic_insights: [
    {
      region: "North America",
      performance: "high" as const,
      opportunity: "Strong performance across all segments"
    },
    {
      region: "Europe",
      performance: "medium" as const,
      opportunity: "Opportunity to expand in Eastern markets"
    }
  ],
  temporal_patterns: {
    best_days: ["Tuesday", "Wednesday", "Thursday"],
    best_hours: ["9-11am", "2-4pm", "7-9pm"],
    seasonal_trends: "Higher engagement during Q4 holiday season"
  },
  recommendations: [
    "Focus budget allocation on Tech-Savvy Professionals segment",
    "Develop mobile-first creative strategy",
    "Implement dynamic pricing for price-sensitive segments",
    "Expand geographic targeting to emerging markets"
  ]
}

export default function WorkspacePage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [hasSnapshot, setHasSnapshot] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleUploadComplete = (files: any[]) => {
    setUploadedFiles(files)
  }

  const startAnalysis = async () => {
    setIsAnalyzing(true)

    // Simulate analysis process
    await new Promise(resolve => setTimeout(resolve, 3000))

    setHasSnapshot(true)
    setIsAnalyzing(false)
  }

  return (
    <div>
      <PageHeader
        title="Workspace"
        description="DATA INGESTION • FEATURE EXTRACTION • ANALYSIS"
        icon={Rocket}
        actions={
          uploadedFiles.length > 0 && !hasSnapshot && (
            <Button
              variant="primary"
              size="lg"
              glow
              loading={isAnalyzing}
              onClick={startAnalysis}
            >
              <Play className="w-5 h-5" />
              {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
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
          />
        </section>

        {/* Analysis Status */}
        {uploadedFiles.length > 0 && !hasSnapshot && (
          <section>
            <Card variant="holo">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Ready for Analysis
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {uploadedFiles.length} artifact(s) uploaded. Click Start Analysis to begin feature extraction.
                  </p>

                  {isAnalyzing && (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                      <p className="text-electric-500 font-mono text-sm">
                        AI agents extracting features and generating insights...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Analysis Snapshot */}
        {hasSnapshot && (
          <section>
            <AnalysisSnapshot snapshot={sampleSnapshot} />
          </section>
        )}

        {/* Empty State */}
        {uploadedFiles.length === 0 && (
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
