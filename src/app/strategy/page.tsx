'use client'

import { useState } from 'react'
import { Target, Settings, CheckCircle, XCircle, Edit3, Clock, Users, MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PatchCard } from '@/components/strategy/PatchCard'
import { StrategyOverview } from '@/components/strategy/StrategyOverview'
import { EditPatchDialog } from '@/components/strategy/EditPatchDialog'

// Sample strategy data
const sampleStrategy = {
  strategy_id: "strat_001",
  version: 1,
  created_at: "2024-09-28T15:30:00Z",
  audience_targeting: {
    segments: [
      {
        name: "Tech-Savvy Professionals",
        targeting_criteria: {
          age: "25-45",
          interests: ["technology", "innovation", "productivity"],
          income: "75k+",
          location: "urban_areas"
        },
        budget_allocation: "60%",
        priority: "high"
      },
      {
        name: "Budget-Conscious Families",
        targeting_criteria: {
          age: "30-50",
          interests: ["family", "savings", "value"],
          income: "45k-75k",
          location: "suburban_areas"
        },
        budget_allocation: "40%",
        priority: "medium"
      }
    ]
  },
  messaging_strategy: {
    primary_message: "Innovative solutions that deliver real value",
    tone: "professional yet approachable",
    key_themes: ["innovation", "efficiency", "value", "results"]
  },
  channel_strategy: {
    primary_channels: ["social_media", "search_ads", "content_marketing"],
    budget_split: {
      "social_media": "45%",
      "search_ads": "35%",
      "content_marketing": "20%"
    },
    scheduling: {
      peak_hours: ["10-12pm", "2-4pm", "7-9pm"],
      peak_days: ["Tuesday", "Wednesday", "Thursday"]
    }
  },
  budget_allocation: {
    total_budget: "$15,000",
    channel_breakdown: {
      "social_media": "$6,750",
      "search_ads": "$5,250",
      "content_marketing": "$3,000"
    },
    optimization_strategy: "Focus on high-performing segments and scale successful creative themes"
  }
}

// Sample pending patch
const samplePatch = {
  patch_id: "patch_001",
  source: "insights" as const,
  status: "proposed" as const,
  patch_json: {
    audience_targeting: {
      segments: [
        {
          name: "Tech-Savvy Professionals",
          targeting_criteria: {
            age: "25-40", // Narrowed age range
            interests: ["technology", "innovation", "AI", "productivity"],
            income: "85k+", // Increased income threshold
            location: "urban_areas"
          },
          budget_allocation: "70%", // Increased allocation
          priority: "high"
        },
        {
          name: "Early Adopters",
          targeting_criteria: {
            age: "22-35",
            interests: ["technology", "startups", "innovation"],
            income: "60k+",
            behaviors: ["early_tech_adopters"]
          },
          budget_allocation: "30%",
          priority: "high"
        }
      ]
    },
    budget_allocation: {
      total_budget: "$18,000", // Increased budget
      channel_breakdown: {
        "social_media": "$8,100",
        "search_ads": "$6,300",
        "content_marketing": "$3,600"
      },
      optimization_strategy: "Focus exclusively on high-value tech segments with proven conversion rates"
    }
  },
  justification: "Analysis shows 40% higher conversion rates in the 25-40 age demographic with 85k+ income. Recommending budget reallocation to focus on proven high-value segments while adding Early Adopters segment for growth.",
  created_at: "2024-09-28T16:45:00Z"
}

export default function StrategyPage() {
  const [activeStrategy, setActiveStrategy] = useState(sampleStrategy)
  const [pendingPatches, setPendingPatches] = useState([samplePatch])
  const [editingPatch, setEditingPatch] = useState<any>(null)

  const handlePatchAction = (patchId: string, action: 'approve' | 'reject' | 'edit', editRequest?: string) => {
    if (action === 'edit') {
      setEditingPatch(samplePatch)
      return
    }

    // Update patch status
    setPendingPatches(prev =>
      prev.map(patch =>
        patch.patch_id === patchId
          ? { ...patch, status: action === 'approve' ? 'approved' : 'rejected' }
          : patch
      )
    )

    if (action === 'approve') {
      // Apply patch to strategy with proper deep merging
      setActiveStrategy(prev => ({
        ...prev,
        audience_targeting: samplePatch.patch_json.audience_targeting || prev.audience_targeting,
        budget_allocation: {
          ...prev.budget_allocation,
          ...samplePatch.patch_json.budget_allocation
        },
        version: prev.version + 1
      }))

      // Remove from pending
      setPendingPatches(prev => prev.filter(patch => patch.patch_id !== patchId))
    }
  }

  const handlePatchEdit = (editedPatch: any) => {
    // Apply edited patch
    setActiveStrategy(prev => ({
      ...prev,
      ...editedPatch,
      version: prev.version + 1
    }))

    // Remove from pending
    setPendingPatches(prev => prev.filter(patch => patch.patch_id !== editingPatch?.patch_id))

    setEditingPatch(null)
  }

  return (
    <div>
      <PageHeader
        title="Strategy"
        description="MISSION CONTROL • STRATEGY MANAGEMENT • HITL APPROVAL"
        icon={Target}
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="success" glow>
              Active Strategy v{activeStrategy.version}
            </Badge>
            {pendingPatches.length > 0 && (
              <Badge variant="warning" glow>
                {pendingPatches.length} Pending Patch{pendingPatches.length !== 1 ? 'es' : ''}
              </Badge>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {/* Pending Patches - HITL Section */}
        {pendingPatches.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-heading font-bold text-white mb-2 flex items-center gap-3">
                <Clock className="w-6 h-6 text-neon-amber" />
                Incoming Recommendations
                <Badge variant="warning" glow>
                  Human Review Required
                </Badge>
              </h2>
              <p className="text-gray-400">
                AI agents have proposed strategy patches. Review and approve, reject, or edit recommendations.
              </p>
            </div>

            <div className="space-y-4">
              {pendingPatches.map((patch) => (
                <PatchCard
                  key={patch.patch_id}
                  patch={patch}
                  onAction={handlePatchAction}
                />
              ))}
            </div>
          </section>
        )}

        {/* Active Strategy Overview */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-2 flex items-center gap-3">
              <Settings className="w-6 h-6 text-electric-500" />
              Active Strategy
              <Badge variant="success">v{activeStrategy.version}</Badge>
            </h2>
            <p className="text-gray-400">
              Current marketing strategy configuration and segment allocation
            </p>
          </div>

          <StrategyOverview strategy={activeStrategy} />
        </section>

        {/* Strategy History */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Strategy Evolution
            </h2>
            <p className="text-gray-400">
              Version history and applied patches
            </p>
          </div>

          <Card variant="holo">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-electric-500/10 border border-electric-500/30">
                  <div className="w-10 h-10 rounded-full bg-electric-500 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Strategy v{activeStrategy.version} - Current</p>
                    <p className="text-sm text-gray-400">Applied insights patch • {new Date().toLocaleDateString()}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                {activeStrategy.version > 1 && (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-space-200/50 border border-space-300">
                    <div className="w-10 h-10 rounded-full bg-space-300 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">Strategy v1 - Original</p>
                      <p className="text-sm text-gray-400">Initial strategy from feature analysis • Earlier</p>
                    </div>
                    <Badge variant="default">Archived</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Edit Patch Dialog */}
      {editingPatch && (
        <EditPatchDialog
          patch={editingPatch}
          onSave={handlePatchEdit}
          onCancel={() => setEditingPatch(null)}
        />
      )}
    </div>
  )
}