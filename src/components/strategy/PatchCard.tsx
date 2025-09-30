'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Edit3, Brain, AlertCircle, Code, Users, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface PatchCardProps {
  patch: {
    patch_id: string
    source: 'insights' | 'reflection' | 'edited_llm'
    status: 'proposed' | 'approved' | 'rejected' | 'superseded'
    patch_json: any
    justification: string
    created_at: string
  }
  onAction: (patchId: string, action: 'approve' | 'reject' | 'edit', editRequest?: string) => void
}

export function PatchCard({ patch, onAction }: PatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'insights': return <Brain className="w-5 h-5" />
      case 'reflection': return <AlertCircle className="w-5 h-5" />
      case 'edited_llm': return <Edit3 className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'insights': return 'info'
      case 'reflection': return 'warning'
      case 'edited_llm': return 'success'
      default: return 'default'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'insights': return 'Insights Agent'
      case 'reflection': return 'Performance Analyzer'
      case 'edited_llm': return 'Human Edited'
      default: return 'Unknown'
    }
  }

  const renderPatchChanges = () => {
    const changes = []

    if (patch.patch_json.audience_targeting) {
      changes.push(
        <div key="audience" className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm font-medium text-white">Audience Targeting</span>
          </div>
          <div className="ml-6 space-y-1">
            {patch.patch_json.audience_targeting.segments?.map((segment: any, idx: number) => (
              <div key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                <span>{segment.name}: {segment.budget_allocation} allocation</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (patch.patch_json.budget_allocation) {
      changes.push(
        <div key="budget" className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-neon-emerald" />
            <span className="text-sm font-medium text-white">Budget Allocation</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="text-sm text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-emerald" />
              <span>Total Budget: {patch.patch_json.budget_allocation.total_budget}</span>
            </div>
            {patch.patch_json.budget_allocation.channel_breakdown && (
              Object.entries(patch.patch_json.budget_allocation.channel_breakdown).map(([channel, amount]) => (
                <div key={channel} className="text-sm text-gray-400 ml-4">
                  {channel}: {amount as string}
                </div>
              ))
            )}
          </div>
        </div>
      )
    }

    if (patch.patch_json.messaging_strategy) {
      changes.push(
        <div key="messaging" className="space-y-2">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-neon-amber" />
            <span className="text-sm font-medium text-white">Messaging Strategy</span>
          </div>
          <div className="ml-6 text-sm text-gray-300">
            {patch.patch_json.messaging_strategy.primary_message}
          </div>
        </div>
      )
    }

    return changes
  }

  return (
    <Card variant="holo" className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-500 to-neon-cyan flex items-center justify-center">
              {getSourceIcon(patch.source)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Strategy Patch Proposed
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getSourceColor(patch.source) as any} glow>
                  {getSourceLabel(patch.source)}
                </Badge>
                <span className="text-xs text-gray-400 font-mono">
                  {new Date(patch.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => onAction(patch.patch_id, 'approve')}
              className="animate-pulse-glow"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onAction(patch.patch_id, 'reject')}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAction(patch.patch_id, 'edit')}
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Justification */}
        <div>
          <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-electric-500" />
            AI Justification
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            {patch.justification}
          </p>
        </div>

        {/* Proposed Changes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-neon-cyan" />
              Proposed Changes
            </h4>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {isExpanded ? (
            <div className="space-y-4">
              {renderPatchChanges()}
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Click "Show Details" to view complete patch diff
            </div>
          )}
        </div>

        {/* Impact Preview */}
        <div className="border-t border-space-300 pt-4">
          <h4 className="text-sm font-medium text-white mb-2">Expected Impact</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-mono font-bold text-neon-emerald">+15%</p>
              <p className="text-xs text-gray-400">Conversion Rate</p>
            </div>
            <div>
              <p className="text-lg font-mono font-bold text-neon-cyan">-$8</p>
              <p className="text-xs text-gray-400">Cost per Acquisition</p>
            </div>
            <div>
              <p className="text-lg font-mono font-bold text-neon-amber">+25%</p>
              <p className="text-xs text-gray-400">ROI</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}