import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  'Groceries':        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Eating Out':       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Entertainment':    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'General Household':'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  'Alcohol & Bars':   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Rent':             'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Utilities':        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Subscriptions':    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Car Rental':       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Flights':          'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  'Bus/Trains':       'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Hotels':           'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'Uber/Cabs':        'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Shopping':         'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Clothing':         'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  'Education':        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Personal':         'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Income':           'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Transfer':         'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Other':            'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
}

const CATEGORY_DOTS: Record<string, string> = {
  'Groceries':         '#16A34A', // vivid green
  'Eating Out':        '#EA580C', // vivid orange
  'Entertainment':     '#7C3AED', // vivid violet
  'General Household': '#475569', // slate
  'Alcohol & Bars':    '#CA8A04', // vivid yellow-gold
  'Rent':              '#92400E', // warm brown
  'Utilities':         '#0891B2', // vivid cyan
  'Subscriptions':     '#4F46E5', // indigo
  'Car Rental':        '#2563EB', // vivid blue
  'Flights':           '#65A30D', // vivid lime
  'Bus/Trains':        '#0D9488', // teal-green
  'Hotels':            '#BE185D', // deep rose
  'Uber/Cabs':         '#7C3AED', // violet
  'Shopping':          '#DB2777', // vivid pink
  'Clothing':          '#C026D3', // vivid fuchsia
  'Education':         '#0E7490', // teal
  'Personal':          '#DC2626', // vivid red
  'Income':            '#15803D', // dark green
  'Transfer':          '#0D9488', // teal-green
  'Other':             '#6B7280', // gray
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Groceries':         '🍓',
  'Eating Out':        '🍕',
  'Entertainment':     '⛷️',
  'General Household': '🛒',
  'Alcohol & Bars':    '🍺',
  'Rent':              '🏠',
  'Utilities':         '⚡',
  'Subscriptions':     '📡',
  'Car Rental':        '🚘',
  'Flights':           '✈️',
  'Bus/Trains':        '🚆',
  'Hotels':            '🏨',
  'Uber/Cabs':         '🚕',
  'Shopping':          '🛍️',
  'Clothing':          '👕',
  'Education':         '📚',
  'Personal':          '🫵',
  'Income':            '💰',
  'Transfer':          '🔄',
  'Other':             '📦',
}

// Dynamic emoji map populated at runtime from budget_categories via CategoriesContext
let _dynamicEmojiMap: Record<string, string> = {}
export function setCategoryEmojiMap(map: Record<string, string>) {
  _dynamicEmojiMap = map
}

// Palette arrays for hash-based fallback (Tailwind classes are all defined above — safe from purging)
const _DOT_PALETTE = Object.values(CATEGORY_DOTS)
const _COLOR_PALETTE = Object.values(CATEGORY_COLORS)

function _hashIndex(str: string, len: number): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff
  return h % len
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? _COLOR_PALETTE[_hashIndex(category, _COLOR_PALETTE.length)]
}

export function getCategoryDotColor(category: string): string {
  return CATEGORY_DOTS[category] ?? _DOT_PALETTE[_hashIndex(category, _DOT_PALETTE.length)]
}

export function getCategoryEmoji(category: string): string {
  return _dynamicEmojiMap[category] ?? CATEGORY_EMOJIS[category] ?? '📦'
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  category?: string
  variant?: 'category' | 'success' | 'danger' | 'warning' | 'info' | 'neutral'
}

const VARIANT_STYLES: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
  category: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400',
}

export function Badge({ category, variant = 'neutral', className, children, ...props }: BadgeProps) {
  const variantClass = category ? getCategoryColor(category) : (VARIANT_STYLES[variant] ?? VARIANT_STYLES.neutral)

  return (
    <span
      className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variantClass, className)}
      {...props}
    >
      {children}
    </span>
  )
}
