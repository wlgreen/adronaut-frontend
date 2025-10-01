'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Wifi, WifiOff, Settings, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'

interface ErrorDisplayProps {
  error: string
  onRetry?: () => void
  retryLabel?: string
  isRetrying?: boolean
  showTroubleshooting?: boolean
  context?: 'analysis' | 'strategy' | 'performance' | 'upload'
}

export function ErrorDisplay({
  error,
  onRetry,
  retryLabel = 'Retry',
  isRetrying = false,
  showTroubleshooting = true,
  context = 'analysis'
}: ErrorDisplayProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [apiKeyStatus, setApiKeyStatus] = useState<'unknown' | 'missing' | 'invalid' | 'valid'>('unknown')

  useEffect(() => {
    // Check network status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    // Check API key status
    const checkApiKey = () => {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!apiKey) {
        setApiKeyStatus('missing')
      } else if (!apiKey.startsWith('sk-')) {
        setApiKeyStatus('invalid')
      } else {
        setApiKeyStatus('valid')
      }
    }
    checkApiKey()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getErrorCategory = (errorMessage: string) => {
    if (errorMessage.includes('Network') || errorMessage.includes('fetch')) return 'network'
    if (errorMessage.includes('Authentication') || errorMessage.includes('API key')) return 'auth'
    if (errorMessage.includes('Rate limit')) return 'rate_limit'
    if (errorMessage.includes('Service unavailable')) return 'service'
    if (errorMessage.includes('timeout')) return 'timeout'
    return 'unknown'
  }

  const getContextualTroubleshooting = (category: string) => {
    const base = {
      network: [
        'Check your internet connection',
        'Try refreshing the page',
        'Verify if other websites are accessible'
      ],
      auth: [
        'Verify your OpenAI API key is correctly configured',
        'Check if the API key has sufficient credits',
        'Ensure the key has the necessary permissions'
      ],
      rate_limit: [
        'Wait a few minutes before trying again',
        'Consider upgrading your OpenAI plan',
        'Reduce the frequency of requests'
      ],
      service: [
        'Check OpenAI status page for outages',
        'Try again in a few minutes',
        'Contact support if the issue persists'
      ],
      timeout: [
        'Try with smaller datasets',
        'Check your network stability',
        'Retry the operation'
      ],
      unknown: [
        'Check browser console (F12) for detailed logs',
        'Try refreshing the page',
        'Contact support if the issue persists'
      ]
    }

    const contextSpecific = {
      analysis: ['Ensure files are uploaded successfully', 'Try with different file types'],
      strategy: ['Verify analysis data is available', 'Check if previous steps completed'],
      performance: ['Ensure campaign data is properly configured', 'Check if backend services are running'],
      upload: ['Verify file permissions', 'Check file size limits']
    }

    return [...base[category as keyof typeof base], ...contextSpecific[context]]
  }

  const errorCategory = getErrorCategory(error)
  const troubleshootingSteps = getContextualTroubleshooting(errorCategory)

  return (
    <Card variant="default" className="border-neon-rose bg-neon-rose/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--neon-rose)', opacity: 0.2 }}>
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--neon-rose)' }} />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="heading-sm mb-2" style={{ color: 'var(--neon-rose)' }}>
                {context === 'analysis' && 'Analysis Error'}
                {context === 'strategy' && 'Strategy Generation Error'}
                {context === 'performance' && 'Performance Analysis Error'}
                {context === 'upload' && 'Upload Error'}
              </h3>
              <p className="body-sm leading-relaxed" style={{ color: 'var(--error)' }}>{error}</p>
            </div>

            {/* System Status */}
            <div className="bg-space-200/30 border border-space-300 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-300">System Status:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                    Network: {isOnline ? 'Connected' : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className={`w-4 h-4 ${
                    apiKeyStatus === 'valid' ? 'text-green-400' :
                    apiKeyStatus === 'missing' ? 'text-yellow-400' : 'text-red-400'
                  }`} />
                  <span className={
                    apiKeyStatus === 'valid' ? 'text-green-400' :
                    apiKeyStatus === 'missing' ? 'text-yellow-400' : 'text-red-400'
                  }>
                    API Key: {
                      apiKeyStatus === 'valid' ? 'Configured' :
                      apiKeyStatus === 'missing' ? 'Missing' : 'Invalid'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            {showTroubleshooting && (
              <div className="bg-space-200/30 border border-space-300 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Troubleshooting Steps:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  {troubleshootingSteps.map((step, index) => (
                    <li key={index}>• {step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
                className="interactive-scale"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>

              {onRetry && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="interactive-scale"
                  glow
                >
                  {isRetrying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    retryLabel
                  )}
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('https://status.openai.com/', '_blank')}
                className="interactive-scale"
              >
                <ExternalLink className="w-4 h-4" />
                OpenAI Status
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}