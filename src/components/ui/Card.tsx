import { clsx } from 'clsx'
import { forwardRef } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'metric' | 'prominent' | 'analysis'
  hover?: boolean
  accentColor?: 'primary' | 'success' | 'warning' | 'info' | 'none'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, accentColor = 'none', children, ...props }, ref) => {
    return (
      <div
        className={clsx(
          'rounded-xl transition-all duration-200 relative',

          // Variant styles
          {
            'bg-surface border border-border': variant === 'default',
            'glass-card': variant === 'glass',
            'card-elevated': variant === 'elevated',
            'metric-card': variant === 'metric',
            'card-prominent': variant === 'prominent',
            'card-analysis': variant === 'analysis',
          },

          // Accent color top borders
          {
            'border-t-2 border-t-primary': accentColor === 'primary',
            'border-t-2 border-t-success': accentColor === 'success',
            'border-t-2 border-t-warning': accentColor === 'warning',
            'border-t-2 border-t-info': accentColor === 'info',
          },

          // Hover effects
          {
            'card-interactive cursor-pointer': hover,
          },

          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={clsx('flex flex-col space-y-1.5 p-5 pb-3', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        className={clsx(
          'font-semibold text-lg leading-none tracking-tight text-white',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        className={clsx('text-sm text-gray-400', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div className={clsx('p-5 pt-0', className)} ref={ref} {...props} />
  }
)

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={clsx('flex items-center p-6 pt-0', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }