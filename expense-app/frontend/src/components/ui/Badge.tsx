import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  'Groceries':           'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  'Dining & Restaurants':'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  'Transportation':      'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  'Utilities':           'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  'Entertainment':       'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  'Shopping':            'bg-pink-500/15 text-pink-400 border border-pink-500/20',
  'Healthcare':          'bg-red-500/15 text-red-400 border border-red-500/20',
  'Subscriptions':       'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  'Travel':              'bg-sky-500/15 text-sky-400 border border-sky-500/20',
  'Housing':             'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  'Insurance':           'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  'Personal Care':       'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  'Education':           'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  'Gifts & Donations':   'bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20',
  'Income':              'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  'Transfer':            'bg-teal-500/15 text-teal-400 border border-teal-500/20',
  'Fees & Charges':      'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20',
  'Other':               'bg-white/05 text-white/40 border border-white/10',
}

const CATEGORY_DOTS: Record<string, string> = {
  'Groceries':           '#10B981',
  'Dining & Restaurants':'#F97316',
  'Transportation':      '#3B82F6',
  'Utilities':           '#EAB308',
  'Entertainment':       '#8B5CF6',
  'Shopping':            '#EC4899',
  'Healthcare':          '#EF4444',
  'Subscriptions':       '#6366F1',
  'Travel':              '#0EA5E9',
  'Housing':             '#F59E0B',
  'Insurance':           '#64748B',
  'Personal Care':       '#F43F5E',
  'Education':           '#06B6D4',
  'Gifts & Donations':   '#D946EF',
  'Income':              '#10B981',
  'Transfer':            '#14B8A6',
  'Fees & Charges':      '#71717A',
  'Other':               '#6B7280',
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
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  danger:  'bg-red-500/15 text-red-400 border border-red-500/20',
  warning: 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
  info:    'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  neutral: 'bg-white/05 text-white/40 border border-white/10',
  category:'bg-white/05 text-white/40 border border-white/10',
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
