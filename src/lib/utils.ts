import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Design system utilities
export const spacing = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
} as const

export const borderRadius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl'
} as const

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
} as const

// Color variants for consistent theming
export const colorVariants = {
  primary: {
    bg: 'bg-indigo-500',
    hover: 'hover:bg-indigo-400',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20'
  },
  success: {
    bg: 'bg-emerald-500',
    hover: 'hover:bg-emerald-400',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20'
  },
  warning: {
    bg: 'bg-amber-500',
    hover: 'hover:bg-amber-400',
    text: 'text-amber-400',
    border: 'border-amber-500/20'
  },
  danger: {
    bg: 'bg-rose-500',
    hover: 'hover:bg-rose-400',
    text: 'text-rose-400',
    border: 'border-rose-500/20'
  }
} as const

// Format numbers for display
export function formatNumber(num: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', options).format(num)
}

// Format currency
export function formatCurrency(num: number) {
  return formatNumber(num, { style: 'currency', currency: 'USD' })
}

// Format percentage
export function formatPercentage(num: number, decimals = 1) {
  return `${num.toFixed(decimals)}%`
}

// Format large numbers with abbreviations
export function formatLargeNumber(num: number) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}