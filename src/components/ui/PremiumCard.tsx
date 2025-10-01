'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PremiumCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'interactive' | 'metric'
  hover?: boolean
}

export function PremiumCard({
  children,
  className,
  variant = 'default',
  hover = false
}: PremiumCardProps) {
  return (
    <div
      className={cn(
        // Base styles
        'relative overflow-hidden transition-all duration-250 ease-out',

        // Variant styles
        {
          // Default card
          'bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg': variant === 'default',

          // Elevated card for important content
          'bg-slate-800/80 backdrop-blur-lg border border-slate-600/50 rounded-xl shadow-xl': variant === 'elevated',

          // Interactive card with hover states
          'bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg cursor-pointer': variant === 'interactive',

          // Metric card for displaying numbers/stats
          'bg-gradient-to-br from-slate-800/70 to-slate-900/50 backdrop-blur-md border border-slate-700/40 rounded-xl shadow-lg': variant === 'metric'
        },

        // Hover effects
        {
          'hover:border-indigo-500/50 hover:shadow-xl hover:-translate-y-0.5': hover || variant === 'interactive'
        },

        className
      )}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: ReactNode
  subtitle?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  subtitle,
  className
}: MetricCardProps) {
  return (
    <PremiumCard variant="metric" hover className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <div className="w-5 h-5 text-indigo-400">
                  {icon}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-slate-300 tracking-wide">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {change && (
            <div className={cn(
              'px-2 py-1 rounded-md text-xs font-medium',
              {
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': changeType === 'positive',
                'bg-rose-500/10 text-rose-400 border border-rose-500/20': changeType === 'negative',
                'bg-slate-500/10 text-slate-400 border border-slate-500/20': changeType === 'neutral'
              }
            )}>
              {change}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="font-mono text-2xl font-bold text-slate-100 tracking-tight">
          {value}
        </div>
      </div>
    </PremiumCard>
  )
}