import { useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { MonthTrend } from '../../lib/api'

interface SavingsRatePanelProps {
  currentTrend: MonthTrend[]
  prevTrend?: MonthTrend[]
  loading?: boolean
}

function calcRate(income: number, spending: number) {
  if (income <= 0) return 0
  return Math.max(0, Math.round(((income - Math.abs(spending)) / income) * 100))
}

function fmtMoney(n: number) {
  const abs = Math.abs(n)
  return abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${Math.round(abs)}`
}

function toLabel(month: string) {
  try { return format(parseISO(`${month}-01`), 'MMM') } catch { return month }
}

export function SavingsRatePanel({ currentTrend, prevTrend, loading }: SavingsRatePanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 skeleton rounded-lg" />)}
        </div>
        <div className="h-[148px] skeleton rounded-lg" />
      </div>
    )
  }

  const totalIncome = currentTrend.reduce((s, t) => s + t.income, 0)
  const totalSpending = currentTrend.reduce((s, t) => s + Math.abs(t.spending), 0)
  const totalSaved = totalIncome - totalSpending

  const hasCompare = (prevTrend?.length ?? 0) > 0

  const chartData = useMemo(() => currentTrend.map((d, i) => {
    const prev = prevTrend?.[i]
    return {
      month: toLabel(d.month),
      rate: calcRate(d.income, d.spending),
      ...(prev !== undefined ? { compareRate: calcRate(prev.income, prev.spending) } : {}),
    }
  }), [currentTrend, prevTrend])

  const stats = [
    { label: 'Income', value: fmtMoney(totalIncome), cls: 'text-status-positive' },
    { label: 'Spending', value: fmtMoney(totalSpending), cls: 'text-accent-500' },
    {
      label: 'Saved',
      value: (totalSaved >= 0 ? '+' : '-') + fmtMoney(totalSaved),
      cls: totalSaved >= 0 ? 'text-status-positive' : 'text-status-negative',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Compact period totals */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2.5">
            <div className={`text-sm font-bold font-money ${s.cls}`}>{s.value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Savings rate trend chart */}
      {chartData.length > 0 ? (
        <div>
          {hasCompare && (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-4 h-0.5 inline-block rounded" style={{ background: '#4a9d5b' }} />
                <span>This period</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <svg width="16" height="6">
                  <line x1="0" y1="3" x2="16" y2="3" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
                <span>Previous</span>
              </div>
            </div>
          )}
          <ResponsiveContainer width="100%" height={148}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a9d5b" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#4a9d5b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,0,0,0.05)"
                className="dark:stroke-white/[0.05]"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-gray-400"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-gray-400"
                axisLine={false}
                tickLine={false}
                width={32}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-surface dark:bg-gray-800 rounded shadow-soft border border-border-light dark:border-border-dark px-2.5 py-1.5 text-xs">
                      <div className="text-gray-500 mb-0.5">{label}</div>
                      {payload.map((p: any) => (
                        <div key={p.dataKey} className="font-money font-semibold" style={{ color: p.color }}>
                          {p.value}%
                          {p.dataKey === 'compareRate' && (
                            <span className="font-normal text-gray-400 ml-1">prev</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              {hasCompare && (
                <Line
                  type="monotone"
                  dataKey="compareRate"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 3, fill: '#94a3b8', strokeWidth: 0 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="rate"
                stroke="#4a9d5b"
                strokeWidth={2}
                fill="url(#savingsGrad)"
                dot={{ r: 3, fill: '#4a9d5b', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#4a9d5b', strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex items-center justify-center h-36 text-sm text-gray-400">No data</div>
      )}
    </div>
  )
}
