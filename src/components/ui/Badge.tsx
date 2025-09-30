import { clsx } from 'clsx'
import { forwardRef } from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  glow?: boolean
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', glow = false, ...props }, ref) => {
    return (
      <div
        className={clsx(
          'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium border',
          'transition-all duration-200',

          // Variant styles
          {
            'bg-surface text-gray-300 border-border': variant === 'default',
            'bg-success/20 text-success border-success/50': variant === 'success',
            'bg-warning/20 text-warning border-warning/50': variant === 'warning',
            'bg-error/20 text-error border-error/50': variant === 'danger',
            'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/50': variant === 'info',
          },

          // Subtle glow for important badges
          {
            'animate-pulse-subtle': glow,
          },

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }