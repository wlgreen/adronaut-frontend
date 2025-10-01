'use client'

import { useState, useEffect } from 'react'
import { Bug, Download, Trash2, Eye, EyeOff, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { errorLogger } from '@/lib/error-logger'

interface ErrorConsoleProps {
  isVisible?: boolean
  onToggle?: () => void
}

export function ErrorConsole({ isVisible = false, onToggle }: ErrorConsoleProps) {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Refresh logs when console becomes visible
      setLogs(errorLogger.getLogs())
    }
  }, [isVisible])

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setLogs(errorLogger.getLogs())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isVisible])

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter)

  const exportLogs = () => {
    const logsData = errorLogger.exportLogs()
    const blob = new Blob([logsData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adronaut-error-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    errorLogger.clearLogs()
    setLogs([])
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'info': return <Info className="w-4 h-4 text-blue-400" />
      default: return <Info className="w-4 h-4 text-gray-400" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400'
      case 'warn': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggle}
          className="bg-space-300/80 backdrop-blur-sm border border-space-400 hover:bg-space-200"
        >
          <Bug className="w-4 h-4" />
          Debug ({logs.filter(l => l.level === 'error').length})
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`bg-space-100/95 backdrop-blur-sm border border-space-300 ${isExpanded ? 'w-96 h-96' : 'w-80 h-64'} transition-all duration-300`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-electric-500" />
              <span className="text-sm font-semibold text-white">Error Console</span>
              <Badge variant="info" className="text-xs">
                {filteredLogs.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1"
              >
                {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onToggle}
                className="p-1"
              >
                ×
              </Button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1">
            {['all', 'error', 'warn', 'info'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setFilter(f as any)}
                className="text-xs py-1 px-2"
              >
                {f}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          {/* Actions */}
          <div className="flex gap-2 mb-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="text-xs"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </Button>
          </div>

          {/* Logs */}
          <div className={`overflow-y-auto space-y-2 ${isExpanded ? 'h-64' : 'h-32'}`}>
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-400 text-xs py-4">
                No {filter === 'all' ? '' : filter} logs
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className="bg-space-200/50 rounded px-2 py-2 text-xs border border-space-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getLevelIcon(log.level)}
                    <span className={`font-mono text-xs ${getLevelColor(log.level)}`}>
                      [{log.context}]
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-300 text-xs mb-1">
                    {log.message}
                  </div>
                  {log.details && (
                    <div className="text-gray-400 text-xs font-mono bg-space-300/30 rounded px-1 py-1 mt-1">
                      {typeof log.details === 'string'
                        ? log.details
                        : JSON.stringify(log.details, null, 2).slice(0, 100)
                      }{typeof log.details === 'object' && JSON.stringify(log.details).length > 100 && '...'}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}