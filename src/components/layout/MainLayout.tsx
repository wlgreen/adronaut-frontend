'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Navigation } from './Navigation'
import { Button } from '@/components/ui/Button'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation Sidebar */}
      <Navigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay for mobile/tablet */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div style={{
        minHeight: '100vh',
        transition: 'all 0.3s ease',
        marginLeft: sidebarOpen ? '256px' : '0px'
      }}>
        {/* Sidebar Toggle Button */}
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-surface border border-border hover:bg-surface-hover shadow-sm"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4 text-gray-400" />
            ) : (
              <Menu className="w-4 h-4 text-gray-400" />
            )}
          </Button>
        </div>

        <main className="relative px-6 py-6 pt-20">
          {children}
        </main>
      </div>
    </div>
  )
}