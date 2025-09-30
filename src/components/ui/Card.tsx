import { clsx } from 'clsx'
import { forwardRef } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    return (
      <div
        className={clsx(
          'rounded-xl transition-all duration-200',

          // Variant styles
          {
            'bg-surface border border-border': variant === 'default',
            'bg-surface border border-border shadow-sm': variant === 'glass',
            'bg-surface border border-border shadow-sm': variant === 'elevated',
          },

          // Hover effects
          {
            'hover:border-primary/30 hover:shadow-sm cursor-pointer': hover,
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
        className={clsx('flex flex-col space-y-1.5 p-6 pb-3', className)}
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
    return <div className={clsx('p-6 pt-0', className)} ref={ref} {...props} />
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