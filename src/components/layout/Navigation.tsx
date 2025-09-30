'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Rocket, Target, BarChart3, Zap } from 'lucide-react'

const navItems = [
  {
    name: 'Workspace',
    href: '/',
    icon: Rocket,
    description: 'Upload & Analysis'
  },
  {
    name: 'Strategy',
    href: '/strategy',
    icon: Target,
    description: 'Mission Control'
  },
  {
    name: 'Results',
    href: '/results',
    icon: BarChart3,
    description: 'Telemetry Dashboard'
  }
]

interface NavigationProps {
  isOpen: boolean
  onClose: () => void
}

export function Navigation({ isOpen, onClose }: NavigationProps) {
  const pathname = usePathname()

  return (
    <nav className={`w-64 h-screen bg-surface/95 backdrop-blur-md border-r border-border fixed left-0 top-0 z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Logo/Title */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-white">
              Adronaut
            </h1>
            <p className="text-xs text-gray-400">
              Marketing Analytics
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={clsx(
                  'group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  'hover:bg-surface-hover',
                  {
                    'bg-primary/10 border-l-2 border-primary': isActive,
                    'border-l-2 border-transparent': !isActive,
                  }
                )}
              >
                <Icon
                  className={clsx(
                    'w-5 h-5 transition-colors duration-200',
                    {
                      'text-primary': isActive,
                      'text-gray-400 group-hover:text-gray-300': !isActive,
                    }
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      'font-medium transition-colors duration-200',
                      {
                        'text-white': isActive,
                        'text-gray-300 group-hover:text-white': !isActive,
                      }
                    )}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors duration-200">
                    {item.description}
                  </p>
                </div>

                {/* Subtle active indicator */}
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Status Panel */}
      <div className="absolute bottom-6 left-4 right-4">
        <div className="glass-panel p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">System Status</p>
              <p className="text-xs text-gray-400">All systems operational</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-success" />
          </div>
        </div>
      </div>
    </nav>
  )
}