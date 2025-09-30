'use client'

import { useState, useEffect } from 'react'
import { Target, Settings, CheckCircle, XCircle, Edit3, Clock, Users, MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PatchCard } from '@/components/strategy/PatchCard'
import { StrategyOverview } from '@/components/strategy/StrategyOverview'
import { EditPatchDialog } from '@/components/strategy/EditPatchDialog'
import { useStrategyData, useWorkspaceData } from '@/hooks/useLLMData'


export default function StrategyPage() {
  const [editingPatch, setEditingPatch] = useState<any>(null)
  const [projectId, setProjectId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adronaut_project_id') || `proj_${Date.now()}`
    }
    return `proj_${Date.now()}`
  })

  const { analysisSnapshot } = useWorkspaceData(projectId)
  const {
    activeStrategy,
    pendingPatches,
    isGeneratingStrategy,
    isGeneratingPatches,
    error,
    generateStrategy,
    generatePatches,
    applyPatch
  } = useStrategyData(projectId)

  const handlePatchAction = async (patchId: string, action: 'approve' | 'reject' | 'edit', editRequest?: string) => {
    if (action === 'edit') {
      const patch = pendingPatches.find(p => p.patch_id === patchId)
      if (patch) setEditingPatch(patch)
      return
    }

    await applyPatch(patchId, action)
  }

  const handlePatchEdit = (editedPatch: any) => {
    // This would need more sophisticated patch editing logic
    setEditingPatch(null)
  }

  // Generate strategy from analysis if we have analysis but no strategy
  useEffect(() => {
    if (analysisSnapshot && !activeStrategy && !isGeneratingStrategy) {
      generateStrategy(analysisSnapshot)
    }
  }, [analysisSnapshot, activeStrategy, isGeneratingStrategy, generateStrategy])

  return (
    <div>
      <PageHeader
        title="Strategy"
        description="MISSION CONTROL • STRATEGY MANAGEMENT • HITL APPROVAL"
        icon={Target}
        actions={
          <div className="flex items-center gap-3">
            {activeStrategy && (
              <Badge variant="success" glow>
                Active Strategy v{activeStrategy.version}
              </Badge>
            )}
            {isGeneratingStrategy && (
              <Badge variant="warning" glow>
                Generating Strategy...
              </Badge>
            )}
            {pendingPatches.length > 0 && (
              <Badge variant="warning" glow>
                {pendingPatches.length} Pending Patch{pendingPatches.length !== 1 ? 'es' : ''}
              </Badge>
            )}
            {!analysisSnapshot && (
              <Button variant="secondary" size="sm" onClick={() => window.location.href = '/'}>
                Upload Data First
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {/* Error Display */}
        {error && (
          <section>
            <Card variant="default" className="border-red-500 bg-red-500/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-400">Strategy Error</h3>
                    <p className="text-sm text-red-300 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Strategy Generation Loading */}
        {isGeneratingStrategy && (
          <section>
            <Card variant="default">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <h3 className="font-semibold text-white">Generating Strategy</h3>
                    <p className="text-sm text-gray-400 mt-1">AI agents are creating your marketing strategy from analysis insights...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* No Analysis Warning */}
        {!analysisSnapshot && !isGeneratingStrategy && (
          <section>
            <Card variant="default" className="border-yellow-500 bg-yellow-500/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <div>
                    <h3 className="font-semibold text-yellow-400">No Analysis Data</h3>
                    <p className="text-sm text-yellow-300 mt-1">Upload and analyze data files in the Workspace before generating a strategy.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

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
        {activeStrategy && (
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
        )}

        {/* Strategy History */}
        {activeStrategy && (
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
        )}
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