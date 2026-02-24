import { SpendingCategory } from '../../types'
import { getCategoryDotColor } from '../ui/Badge'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { clsx } from 'clsx'

interface ComparisonTableProps {
  current: SpendingCategory[]
  previous: SpendingCategory[]
  loading?: boolean
}

function formatMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function ComparisonTable({ current, previous, loading }: ComparisonTableProps) {
  if (loading) return (
    <div className="space-y-3">
      {[1,2,3,4,5].map(i => <div key={i} className="h-8 skeleton" />)}
    </div>
  )

  const allCats = [...new Set([...current.map(c => c.category), ...previous.map(c => c.category)])]

  const rows = allCats.map(cat => {
    const curr = current.find(c => c.category === cat)?.amount ?? 0
    const prev = previous.find(c => c.category === cat)?.amount ?? 0
    const currAbs = Math.abs(curr)
    const prevAbs = Math.abs(prev)
    const delta = prevAbs > 0 ? ((currAbs - prevAbs) / prevAbs) * 100 : 0
    return { cat, currAbs, prevAbs, delta }
  })
    .filter(r => r.currAbs > 0 || r.prevAbs > 0)
    .sort((a, b) => b.currAbs - a.currAbs)

  if (!rows.length) return (
    <p className="text-sm text-gray-400 text-center py-8">No comparison data available</p>
  )

  const maxVal = Math.max(...rows.flatMap(r => [r.currAbs, r.prevAbs]))

  return (
    <div className="space-y-4">
      {rows.map(({ cat, currAbs, prevAbs, delta }) => (
        <div key={cat} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryDotColor(cat) }} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat}</span>
            </div>
            <div className="flex items-center gap-2">
              {delta !== 0 && (
                <span className={clsx(
                  'text-xs font-medium flex items-center gap-0.5',
                  delta > 0 ? 'text-status-negative' : 'text-status-positive'
                )}>
                  {delta > 0
                    ? <><ArrowUpRight size={12} />+{Math.abs(Math.round(delta))}%</>
                    : <><ArrowDownRight size={12} />-{Math.abs(Math.round(delta))}%</>
                  }
                </span>
              )}
            </div>
          </div>

          {/* This month bar */}
          <div className="flex items-center gap-2">
            <span className="w-20 text-xs font-money text-gray-600 dark:text-gray-400 text-right">{formatMoney(currAbs)}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-500"
                style={{ width: `${maxVal ? (currAbs / maxVal) * 100 : 0}%` }}
              />
            </div>
            <span className="w-20 text-xs text-gray-400 dark:text-gray-500">This month</span>
          </div>

          {/* Last month bar */}
          {prevAbs > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-20 text-xs font-money text-gray-400 dark:text-gray-500 text-right">{formatMoney(prevAbs)}</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-500"
                  style={{ width: `${maxVal ? (prevAbs / maxVal) * 100 : 0}%` }}
                />
              </div>
              <span className="w-20 text-xs text-gray-400 dark:text-gray-500">Last month</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
