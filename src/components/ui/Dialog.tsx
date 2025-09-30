'use client'

import { clsx } from 'clsx'
import { forwardRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>,
    document.body
  )
}

const DialogContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={clsx(
          'holo-panel rounded-2xl p-6 w-full max-w-lg mx-4',
          'animate-float',
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

DialogContent.displayName = 'DialogContent'

const DialogHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={clsx('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

DialogHeader.displayName = 'DialogHeader'

const DialogTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        className={clsx(
          'font-heading text-lg font-semibold leading-none tracking-tight text-white glow-text',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

DialogTitle.displayName = 'DialogTitle'

const DialogDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
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

DialogDescription.displayName = 'DialogDescription'

const DialogFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={clsx('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}
        ref={ref}
        {...props}
      />
    )
  }
)

DialogFooter.displayName = 'DialogFooter'

const DialogClose = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    return (
      <button
        className={clsx(
          'absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100',
          'focus:outline-none focus:ring-2 focus:ring-electric-500 focus:ring-offset-2',
          'disabled:pointer-events-none',
          className
        )}
        ref={ref}
        {...props}
      >
        <X className="h-4 w-4 text-gray-400" />
        <span className="sr-only">Close</span>
      </button>
    )
  }
)

DialogClose.displayName = 'DialogClose'

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
}