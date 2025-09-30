import { clsx } from 'clsx'
import { forwardRef } from 'react'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
  animated?: boolean
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = 'default', animated = false, ...props }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

    return (
      <div
        className={clsx(
          'relative h-2 w-full overflow-hidden rounded-full bg-surface',
          className
        )}
        ref={ref}
        {...props}
      >
        <div
          className={clsx(
            'h-full transition-all duration-300 ease-out rounded-full',

            // Variant styles
            {
              'bg-primary': variant === 'default',
              'bg-success': variant === 'success',
              'bg-warning': variant === 'warning',
              'bg-error': variant === 'danger',
            },

            // Subtle animation
            {
              'animate-pulse-subtle': animated,
            }
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)

Progress.displayName = 'Progress'

export { Progress }