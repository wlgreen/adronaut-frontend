'use client'

import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { Rocket, Target, BarChart3, Zap } from 'lucide-react'

interface NavigationItemProps {
  href: string
  icon: ReactNode
  label: string
  badge?: string
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger'
  description?: string
  isActive?: boolean
}

export function NavigationItem({
  href,
  icon,
  label,
  badge,
  badgeVariant = 'default',
  description,
  isActive
}: NavigationItemProps) {
  const pathname = usePathname()
  const active = isActive ?? pathname === href

  return (
    <Link href={href}>
      <div
        className={cn(
          'group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-out',
          'hover:bg-slate-800/50 hover:backdrop-blur-sm',
          {
            'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 shadow-sm': active,
            'text-slate-300 hover:text-slate-200': !active
          }
        )}
      >
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
        )}

        {/* Icon */}
        <div className={cn(
          'w-5 h-5 transition-colors duration-200',
          {
            'text-indigo-400': active,
            'text-slate-400 group-hover:text-slate-300': !active
          }
        )}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{label}</span>
            {badge && (
              <Badge
                variant={badgeVariant}
                className="text-xs px-1.5 py-0.5"
              >
                {badge}
              </Badge>
            )}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
          )}
        </div>

        {/* Hover indicator */}
        <div className={cn(
          'w-2 h-2 rounded-full transition-all duration-200',
          {
            'bg-indigo-400': active,
            'bg-transparent group-hover:bg-slate-400': !active
          }
        )} />
      </div>
    </Link>
  )
}

interface NavigationSectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function NavigationSection({ title, children, className }: NavigationSectionProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

interface PremiumNavigationProps {
  isOpen: boolean
  onClose: () => void
}

export function PremiumNavigation({ isOpen, onClose }: PremiumNavigationProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full z-40 transition-transform duration-300 ease-out',
          'w-64 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50',
          {
            'translate-x-0': isOpen,
            '-translate-x-full': !isOpen
          }
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100">Adronaut</h1>
              <p className="text-xs text-slate-400">Marketing Analytics</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <NavigationSection title="Main">
            <NavigationItem
              href="/"
              icon={<Rocket className="w-5 h-5" />}
              label="Workspace"
              description="Upload & Analysis"
            />
            <NavigationItem
              href="/strategy"
              icon={<Target className="w-5 h-5" />}
              label="Strategy"
              description="Mission Control"
            />
            <NavigationItem
              href="/results"
              icon={<BarChart3 className="w-5 h-5" />}
              label="Results"
              description="Telemetry Dashboard"
            />
          </NavigationSection>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-300">System Status</p>
              <p className="text-xs text-slate-500">All systems operational</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

