'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export function PremiumButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  ...props
}: PremiumButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',

        // Size variants
        {
          'px-3 py-1.5 text-sm rounded-lg': size === 'sm',
          'px-4 py-2 text-sm rounded-lg': size === 'md',
          'px-6 py-3 text-base rounded-xl': size === 'lg'
        },

        // Style variants
        {
          // Primary - Main CTA
          'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-xl border border-indigo-500/50 hover:border-indigo-400/50 focus:ring-indigo-500': variant === 'primary',

          // Secondary - Alternative actions
          'bg-slate-700/60 hover:bg-slate-600/60 text-slate-200 hover:text-white shadow-md hover:shadow-lg border border-slate-600/50 hover:border-slate-500/50 focus:ring-slate-500 backdrop-blur-sm': variant === 'secondary',

          // Ghost - Subtle actions
          'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-slate-200 border border-transparent hover:border-slate-700/50 focus:ring-slate-600': variant === 'ghost',

          // Danger - Destructive actions
          'bg-rose-600 hover:bg-rose-500 text-white shadow-lg hover:shadow-xl border border-rose-500/50 hover:border-rose-400/50 focus:ring-rose-500': variant === 'danger'
        },

        // Hover transform
        'hover:-translate-y-0.5 active:translate-y-0',

        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}

      {/* Left icon */}
      {icon && iconPosition === 'left' && !loading && (
        <span className="w-4 h-4">{icon}</span>
      )}

      {/* Content */}
      <span>{children}</span>

      {/* Right icon */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="w-4 h-4">{icon}</span>
      )}

      {/* Subtle glow effect for primary */}
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-200 pointer-events-none" />
      )}
    </button>
  )
}

interface ButtonGroupProps {
  children: ReactNode
  className?: string
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      {children}
    </div>
  )
}