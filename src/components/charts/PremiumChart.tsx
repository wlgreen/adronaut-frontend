'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ChartContainerProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
  timeRange?: string[]
  selectedRange?: string
  onRangeChange?: (range: string) => void
}

export function ChartContainer({
  title,
  subtitle,
  children,
  className,
  actions,
  timeRange,
  selectedRange,
  onRangeChange
}: ChartContainerProps) {
  return (
    <div className={cn(
      'bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg',
      'transition-all duration-250 ease-out hover:border-slate-600/50 hover:shadow-xl',
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            {subtitle && (
              <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Time range selector */}
            {timeRange && (
              <div className="flex gap-1 p-1 bg-slate-900/50 rounded-lg border border-slate-700/50">
                {timeRange.map((range) => (
                  <button
                    key={range}
                    onClick={() => onRangeChange?.(range)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150',
                      {
                        'bg-indigo-500 text-white shadow-sm': selectedRange === range,
                        'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50': selectedRange !== range
                      }
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}

            {actions}
          </div>
        </div>
      </div>

      {/* Chart content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

interface MetricBarProps {
  label: string
  value: number
  maxValue: number
  color?: string
  showValue?: boolean
  className?: string
}

export function MetricBar({
  label,
  value,
  maxValue,
  color = 'bg-indigo-500',
  showValue = true,
  className
}: MetricBarProps) {
  const percentage = Math.max(4, (value / maxValue) * 100)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{label}</span>
        {showValue && (
          <span className="text-sm font-mono text-slate-400">
            {value.toLocaleString()}
          </span>
        )}
      </div>

      <div className="relative">
        {/* Background track */}
        <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
          {/* Progress bar */}
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              color
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Glow effect */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 h-2 rounded-full opacity-30 blur-sm transition-all duration-500',
            color
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface TrendLineProps {
  data: Array<{ date: string; value: number }>
  color?: string
  height?: number
  showDots?: boolean
  className?: string
}

export function TrendLine({
  data,
  color = 'stroke-indigo-400',
  height = 80,
  showDots = false,
  className
}: TrendLineProps) {
  if (!data.length) return null

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  // Generate SVG path
  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((point.value - minValue) / range) * 100
    return `${x},${y}`
  }).join(' ')

  const pathData = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - ((point.value - minValue) / range) * 100
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
  }).join(' ')

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={`${pathData} L 100 100 L 0 100 Z`}
          fill="url(#trendGradient)"
          className={color.replace('stroke-', 'text-')}
        />

        {/* Trend line */}
        <path
          d={pathData}
          fill="none"
          strokeWidth="2"
          className={cn(color, 'drop-shadow-sm')}
        />

        {/* Data points */}
        {showDots && data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100
          const y = 100 - ((point.value - minValue) / range) * 100
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              className={cn(color.replace('stroke-', 'fill-'), 'drop-shadow-sm')}
            />
          )
        })}
      </svg>
    </div>
  )
}

interface ChartGridProps {
  children: ReactNode
  columns?: number
  className?: string
}

export function ChartGrid({ children, columns = 2, className }: ChartGridProps) {
  return (
    <div className={cn(
      'grid gap-6',
      {
        'grid-cols-1': columns === 1,
        'grid-cols-1 lg:grid-cols-2': columns === 2,
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': columns === 3,
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-4': columns === 4
      },
      className
    )}>
      {children}
    </div>
  )
}