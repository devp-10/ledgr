import { useMemo } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { DashboardSummary } from '../../lib/api'
import { getCategoryDotColor, getCategoryEmoji } from '../ui/Badge'

interface SpendingCategoryBarProps {
  periodData: DashboardSummary[]
  loading?: boolean
}

function fmtK(v: number) {
  return `$${Math.abs(v) >= 1000 ? (Math.abs(v) / 1000).toFixed(2) + 'k' : Math.abs(v).toFixed(2)}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-soft border border-border-light dark:border-border-dark p-3 text-sm min-w-[140px]">
      <div className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">{label}</div>
      <div className="space-y-1">
        {[...payload].sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0)).map((p: any) => (
          p.value > 0 && (
            <div key={p.dataKey} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
                <span className="text-gray-600 dark:text-gray-400 text-xs truncate max-w-[100px]">
                  {getCategoryEmoji(p.dataKey)} {p.dataKey}
                </span>
              </div>
              <span className="font-money text-xs text-gray-900 dark:text-gray-100">{fmtK(p.value)}</span>
            </div>
          )
        ))}
      </div>
      <div className="border-t border-border-light dark:border-border-dark mt-2 pt-1.5 flex justify-between">
        <span className="text-xs text-gray-500">Total</span>
        <span className="font-money text-xs font-semibold text-gray-900 dark:text-gray-100">{fmtK(total)}</span>
      </div>
    </div>
  )
}

export function SpendingCategoryBar({ periodData, loading }: SpendingCategoryBarProps) {
  if (loading) return <div className="h-52 skeleton rounded-lg" />

  // Sort categories by total spending descending
  const sortedCategories = useMemo(() => {
    const totals = new Map<string, number>()
    periodData.forEach(d =>
      d.spending_by_category.forEach(c => {
        totals.set(c.category, (totals.get(c.category) ?? 0) + Math.abs(c.amount))
      })
    )
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat)
  }, [periodData])

  const chartData = useMemo(() =>
    periodData.map(d => {
      const entry: Record<string, string | number> = {
        month: (() => { try { return format(parseISO(`${d.month}-01`), 'MMM yy') } catch { return d.month } })(),
      }
      sortedCategories.forEach(cat => {
        const found = d.spending_by_category.find(c => c.category === cat)
        entry[cat] = found ? Math.abs(found.amount) : 0
      })
      return entry
    }),
    [periodData, sortedCategories]
  )

  if (!chartData.length || !sortedCategories.length) return (
    <div className="flex items-center justify-center h-52 text-sm text-gray-400">No spending data</div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(0,0,0,0.06)"
          className="dark:stroke-white/[0.06]"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtK}
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        {sortedCategories.map((cat, i) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="spend"
            fill={getCategoryDotColor(cat)}
            radius={i === sortedCategories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
