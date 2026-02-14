import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  'Groceries': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  'Dining & Restaurants': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  'Transportation': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  'Utilities': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  'Entertainment': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
  'Shopping': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
  'Healthcare': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  'Subscriptions': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400',
  'Travel': 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
  'Housing': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  'Insurance': 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
  'Personal Care': 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  'Education': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400',
  'Gifts & Donations': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-400',
  'Income': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  'Transfer': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
  'Fees & Charges': 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400',
  'Other': 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
}

const CATEGORY_DOTS: Record<string, string> = {
  'Groceries': '#10B981',
  'Dining & Restaurants': '#F97316',
  'Transportation': '#3B82F6',
  'Utilities': '#EAB308',
  'Entertainment': '#8B5CF6',
  'Shopping': '#EC4899',
  'Healthcare': '#EF4444',
  'Subscriptions': '#6366F1',
  'Travel': '#0EA5E9',
  'Housing': '#F59E0B',
  'Insurance': '#64748B',
  'Personal Care': '#F43F5E',
  'Education': '#06B6D4',
  'Gifts & Donations': '#D946EF',
  'Income': '#10B981',
  'Transfer': '#14B8A6',
  'Fees & Charges': '#71717A',
  'Other': '#9CA3AF',
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['Other']
}

export function getCategoryDotColor(category: string): string {
  return CATEGORY_DOTS[category] || CATEGORY_DOTS['Other']
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  category?: string
  variant?: 'category' | 'success' | 'danger' | 'warning' | 'info' | 'neutral'
}

const VARIANT_STYLES: Record<string, string> = {
  success: 'bg-success-500/10 text-success-600 dark:text-success-400',
  danger: 'bg-danger-500/10 text-danger-600 dark:text-danger-400',
  warning: 'bg-warning-500/10 text-warning-600 dark:text-warning-400',
  info: 'bg-accent-500/10 text-accent-500 dark:text-accent-400',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
  category: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
}

export function Badge({ category, variant = 'neutral', className, children, ...props }: BadgeProps) {
  const variantClass = category
    ? getCategoryColor(category)
    : (VARIANT_STYLES[variant] ?? VARIANT_STYLES.neutral)

  return (
    <span
      className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variantClass, className)}
      {...props}
    >
      {children}
    </span>
  )
}
