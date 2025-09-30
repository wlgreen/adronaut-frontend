'use client'

import { useState } from 'react'
import { Send, X, Brain } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface EditPatchDialogProps {
  patch: {
    patch_id: string
    patch_json: any
    justification: string
  }
  onSave: (editedPatch: any) => void
  onCancel: () => void
}

export function EditPatchDialog({ patch, onSave, onCancel }: EditPatchDialogProps) {
  const [editRequest, setEditRequest] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [editedPatch, setEditedPatch] = useState<any>(null)

  const handleSubmitEdit = async () => {
    if (!editRequest.trim()) return

    setIsProcessing(true)

    // Simulate LLM processing the edit request
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate edited patch (in real app, this would call the LLM service)
    const simulatedEdit = {
      ...patch.patch_json,
      audience_targeting: {
        segments: [
          {
            name: "Premium Tech Professionals",
            targeting_criteria: {
              age: "28-42",
              interests: ["technology", "innovation", "AI", "premium_products"],
              income: "95k+",
              location: "major_tech_hubs"
            },
            budget_allocation: "75%",
            priority: "high"
          },
          {
            name: "Emerging Tech Leaders",
            targeting_criteria: {
              age: "25-35",
              interests: ["startups", "leadership", "innovation"],
              income: "70k+",
              behaviors: ["tech_decision_makers"]
            },
            budget_allocation: "25%",
            priority: "high"
          }
        ]
      },
      budget_allocation: {
        ...patch.patch_json.budget_allocation,
        total_budget: "$20,000"
      },
      edit_rationale: `Applied user request: "${editRequest}"`
    }

    setEditedPatch(simulatedEdit)
    setIsProcessing(false)
  }

  const handleSave = () => {
    if (editedPatch) {
      onSave(editedPatch)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-electric-500" />
            Edit Strategy Patch
          </DialogTitle>
          <DialogDescription>
            Describe your changes in natural language. The AI will rewrite the patch accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Patch Preview */}
          <Card variant="holo">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-white mb-2">Original Patch</h4>
              <div className="text-sm text-gray-300 space-y-2">
                <p><strong>Justification:</strong> {patch.justification}</p>
                <p><strong>Key Changes:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  {patch.patch_json.audience_targeting && (
                    <li>Audience targeting: {patch.patch_json.audience_targeting.segments?.length} segments</li>
                  )}
                  {patch.patch_json.budget_allocation && (
                    <li>Budget: {patch.patch_json.budget_allocation.total_budget}</li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Edit Request Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white">
              What would you like to change?
            </label>
            <div className="relative">
              <textarea
                value={editRequest}
                onChange={(e) => setEditRequest(e.target.value)}
                placeholder="e.g., 'Increase the income threshold to 95k+ and focus more on tech hubs like San Francisco and Seattle. Also increase the total budget to $20,000.'"
                className="w-full h-32 px-4 py-3 bg-space-200 border border-space-300 rounded-lg text-white placeholder-gray-400 focus:border-electric-500 focus:ring-1 focus:ring-electric-500 resize-none"
                disabled={isProcessing}
              />
              <Button
                variant="primary"
                size="sm"
                className="absolute bottom-3 right-3"
                onClick={handleSubmitEdit}
                loading={isProcessing}
                disabled={!editRequest.trim() || isProcessing}
              >
                <Send className="w-4 h-4" />
                Process Request
              </Button>
            </div>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <Card variant="glow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
                  <div>
                    <p className="text-white font-medium">AI Processing Request</p>
                    <p className="text-sm text-gray-400">Analyzing your request and rewriting the patch...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edited Patch Preview */}
          {editedPatch && (
            <Card variant="glow">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-electric-500" />
                  Edited Patch Preview
                </h4>
                <div className="text-sm text-gray-300 space-y-3">
                  <div>
                    <p className="text-white font-medium">Updated Changes:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                      {editedPatch.audience_targeting && (
                        <li>
                          <strong>Audience:</strong> {editedPatch.audience_targeting.segments.map((s: any) => s.name).join(', ')}
                        </li>
                      )}
                      {editedPatch.budget_allocation && (
                        <li>
                          <strong>Budget:</strong> {editedPatch.budget_allocation.total_budget}
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="p-3 rounded bg-electric-500/10 border border-electric-500/30">
                    <p className="text-xs text-gray-400 mb-1">Edit Rationale:</p>
                    <p className="text-sm text-electric-400">{editedPatch.edit_rationale}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleSave}
            disabled={!editedPatch}
            glow={!!editedPatch}
          >
            Apply Edited Patch
          </Button>
        </DialogFooter>

        <DialogClose onClick={onCancel} />
      </DialogContent>
    </Dialog>
  )
}