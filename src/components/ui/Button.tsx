import { clsx } from 'clsx'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', glow = false, loading = false, children, ...props }, ref) => {
    return (
      <button
        className={clsx(
          // Base styles
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'relative overflow-hidden',

          // Size variants
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },

          // Color variants
          {
            'btn-primary': variant === 'primary',
            'btn-success': variant === 'success',
            'btn-danger': variant === 'danger',
            'bg-surface text-gray-300 hover:bg-surface-hover hover:text-white border border-border': variant === 'secondary',
            'bg-transparent text-gray-300 hover:bg-surface/50 hover:text-white border border-transparent': variant === 'ghost',
          },

          // Subtle glow effect for important actions
          {
            'animate-pulse-subtle': glow,
          },

          className
        )}
        disabled={loading || props.disabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={clsx('flex items-center gap-2', { 'opacity-0': loading })}>
          {children}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }