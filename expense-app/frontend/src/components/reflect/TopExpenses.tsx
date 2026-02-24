import { Transaction } from '../../types'
import { getCategoryColor } from '../ui/Badge'
import { clsx } from 'clsx'

interface TopExpensesProps {
  transactions: Transaction[]
  loading?: boolean
}

const MERCHANT_EMOJI: Record<string, string> = {
  'amazon': '🛒', 'whole foods': '🥬', 'walmart': '🛒', 'target': '🎯',
  'costco': '🏪', 'uber': '🚗', 'lyft': '🚗', 'delta': '✈️', 'united': '✈️',
  'southwest': '✈️', 'netflix': '🎬', 'spotify': '🎵', 'apple': '🍎',
  'google': '🔍', 'electric': '⚡', 'gas': '⛽', 'water': '💧',
  'chipotle': '🌯', 'mcdonald': '🍔', 'starbucks': '☕',
}

function getMerchantEmoji(desc: string): string {
  const lower = desc.toLowerCase()
  for (const [key, emoji] of Object.entries(MERCHANT_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '💳'
}

function formatMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function TopExpenses({ transactions, loading }: TopExpensesProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-4 skeleton" />
            <div className="w-8 h-8 rounded-lg skeleton flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 skeleton w-2/3" />
              <div className="h-2.5 skeleton w-1/3" />
            </div>
            <div className="w-16 h-4 skeleton" />
          </div>
        ))}
      </div>
    )
  }

  const expenses = transactions
    .filter(t => t.amount < 0)
    .sort((a, b) => a.amount - b.amount)
    .slice(0, 10)

  if (!expenses.length) return (
    <p className="text-sm text-gray-400 text-center py-8">No expenses this period</p>
  )

  return (
    <div className="space-y-1">
      {expenses.map((t, i) => (
        <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-4 text-right flex-shrink-0">{i + 1}</span>
          <span className="text-lg flex-shrink-0">{getMerchantEmoji(t.description)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</p>
            {t.category && (
              <span className={clsx('text-xs px-1.5 py-0.5 rounded-md font-medium', getCategoryColor(t.category))}>
                {t.category}
              </span>
            )}
          </div>
          <span className="font-money font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
            {formatMoney(t.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}
