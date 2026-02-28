import clsx from 'clsx'

const CATEGORY_COLORS: Record<string, string> = {
  'Groceries': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Dining & Restaurants': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'Transportation': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Utilities': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  'Entertainment': 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Shopping': 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  'Healthcare': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  'Subscriptions': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'Travel': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Housing': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'Insurance': 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'Personal Care': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  'Education': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Gifts & Donations': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
  'Income': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'Transfer': 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  'Fees & Charges': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  'Other': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'Uncategorized': 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const _COLOR_PALETTE = Object.values(CATEGORY_COLORS)

function _hashIndex(str: string, len: number): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff
  return h % len
}

interface Props {
  category: string | null
  className?: string
}

export function CategoryBadge({ category, className }: Props) {
  const label = category || 'Uncategorized'
  const colorClass = CATEGORY_COLORS[label] ?? _COLOR_PALETTE[_hashIndex(label, _COLOR_PALETTE.length)]
  return (
    <span className={clsx(
      'inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
      colorClass,
      className,
    )}>
      {label}
    </span>
  )
}
