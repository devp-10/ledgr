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
    <p className="text-sm text-white/30 text-center py-8">No comparison data available</p>
  )

  const maxVal = Math.max(...rows.flatMap(r => [r.currAbs, r.prevAbs]))

  return (
    <div className="space-y-4">
      {rows.map(({ cat, currAbs, prevAbs, delta }) => (
        <div key={cat} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: getCategoryDotColor(cat),
                  boxShadow: `0 0 6px ${getCategoryDotColor(cat)}60`
                }}
              />
              <span className="text-sm font-medium text-white/70">{cat}</span>
            </div>
            <div className="flex items-center gap-2">
              {delta !== 0 && (
                <span className={clsx(
                  'text-xs font-medium flex items-center gap-0.5',
                  delta > 0 ? 'text-red-400' : 'text-emerald-400'
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
            <span className="w-20 text-xs font-money text-white/50 text-right">{formatMoney(currAbs)}</span>
            <div className="flex-1 h-1 progress-track overflow-hidden">
              <div
                className="progress-neon"
                style={{ width: `${maxVal ? (currAbs / maxVal) * 100 : 0}%` }}
              />
            </div>
            <span className="w-20 text-xs text-white/25">This month</span>
          </div>

          {/* Last month bar */}
          {prevAbs > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-20 text-xs font-money text-white/30 text-right">{formatMoney(prevAbs)}</span>
              <div className="flex-1 h-1 progress-track overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/15 transition-all duration-700"
                  style={{ width: `${maxVal ? (prevAbs / maxVal) * 100 : 0}%` }}
                />
              </div>
              <span className="w-20 text-xs text-white/25">Last month</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
