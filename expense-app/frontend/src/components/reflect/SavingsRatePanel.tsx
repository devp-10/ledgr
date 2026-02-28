import { useMemo } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { MonthTrend } from '../../lib/api'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

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
  if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}k`
  return `$${Math.round(abs)}`
}

function toLabel(month: string) {
  try { return format(parseISO(`${month}-01`), 'MMM') } catch { return month }
}

export function SavingsRatePanel({ currentTrend, prevTrend, loading }: SavingsRatePanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-14 skeleton rounded-lg" />
        <div className="h-8 skeleton rounded-lg" />
        <div className="h-24 skeleton rounded-lg" />
      </div>
    )
  }

  const totalIncome = currentTrend.reduce((s, t) => s + t.income, 0)
  const totalSpending = currentTrend.reduce((s, t) => s + Math.abs(t.spending), 0)
  const totalSaved = totalIncome - totalSpending
  const savingsRate = calcRate(totalIncome, totalSpending)

  const prevTotalIncome = prevTrend?.reduce((s, t) => s + t.income, 0) ?? 0
  const prevTotalSpending = prevTrend?.reduce((s, t) => s + Math.abs(t.spending), 0) ?? 0
  const prevRate = calcRate(prevTotalIncome, prevTotalSpending)
  const rateDelta = prevTrend?.length ? savingsRate - prevRate : null

  const hasCompare = (prevTrend?.length ?? 0) > 0

  const chartData = useMemo(() => currentTrend.map((d, i) => {
    const prev = prevTrend?.[i]
    return {
      month: toLabel(d.month),
      rate: calcRate(d.income, d.spending),
      ...(prev !== undefined ? { compareRate: calcRate(prev.income, prev.spending) } : {}),
    }
  }), [currentTrend, prevTrend])

  const rateColor =
    savingsRate >= 20 ? 'text-status-positive' :
    savingsRate >= 10 ? 'text-amber-500' :
    'text-status-negative'

  return (
    <div className="space-y-4">
      {/* Big rate + delta */}
      <div className="flex items-end justify-between">
        <div>
          <div className={`text-4xl font-bold font-money ${rateColor}`}>
            {savingsRate}%
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">savings rate</div>
        </div>
        {rateDelta !== null && (
          <div className={`flex items-center gap-0.5 text-sm font-medium ${
            rateDelta > 0 ? 'text-status-positive' : rateDelta < 0 ? 'text-status-negative' : 'text-gray-400'
          }`}>
            {rateDelta > 0
              ? <ArrowUpRight size={15} />
              : rateDelta < 0
              ? <ArrowDownRight size={15} />
              : <Minus size={13} />}
            {rateDelta > 0 ? '+' : ''}{rateDelta}pp
            <span className="text-xs text-gray-400 font-normal ml-1">vs prev</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-border-light dark:border-border-dark">
        {[
          { label: 'Income', value: fmtMoney(totalIncome), cls: 'text-status-positive' },
          { label: 'Spending', value: fmtMoney(totalSpending), cls: 'text-accent-500' },
          {
            label: 'Saved',
            value: (totalSaved >= 0 ? '+' : '-') + fmtMoney(totalSaved),
            cls: totalSaved >= 0 ? 'text-status-positive' : 'text-status-negative',
          },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className={`text-base font-bold font-money ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mini trend */}
      {currentTrend.length > 1 && (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-400">Rate over period</span>
            {hasCompare && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <svg width="16" height="6">
                  <line x1="0" y1="3" x2="16" y2="3" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
                <span>prev</span>
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <ComposedChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
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
                tick={{ fontSize: 10, fill: 'currentColor' }}
                className="text-gray-400"
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-surface dark:bg-gray-800 rounded shadow-soft border border-border-light dark:border-border-dark px-2.5 py-1.5 text-xs">
                      <div className="text-gray-500 mb-0.5">{label}</div>
                      {payload.map((p: any) => (
                        <div key={p.dataKey} className="font-money font-semibold" style={{ color: p.color }}>
                          {p.value}%
                          {p.dataKey === 'compareRate' && <span className="font-normal text-gray-400 ml-1">prev</span>}
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
                dot={{ r: 2.5, fill: '#4a9d5b', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#4a9d5b', strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
