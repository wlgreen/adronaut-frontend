'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { PremiumNavigation } from '@/components/navigation/PremiumNavigation'
import { PremiumButton } from '@/components/ui/PremiumButton'
import { ErrorConsole } from '@/components/debug/ErrorConsole'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [errorConsoleVisible, setErrorConsoleVisible] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Premium Navigation Sidebar */}
      <PremiumNavigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div style={{
        minHeight: '100vh',
        transition: 'all 0.3s ease',
        marginLeft: sidebarOpen ? '256px' : '0px'
      }}>
        {/* Sidebar Toggle Button */}
        <div className="fixed top-4 left-4 z-50">
          <PremiumButton
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/80 shadow-sm"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4 text-slate-400" />
            ) : (
              <Menu className="w-4 h-4 text-slate-400" />
            )}
          </PremiumButton>
        </div>

        <main className="relative px-6 py-6 pt-20">
          {children}
        </main>
      </div>

      {/* Error Console - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <ErrorConsole
          isVisible={errorConsoleVisible}
          onToggle={() => setErrorConsoleVisible(!errorConsoleVisible)}
        />
      )}
    </div>
  )
}