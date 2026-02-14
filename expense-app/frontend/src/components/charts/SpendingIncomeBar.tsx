import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { MonthTrend } from '../../types'
import { format, parseISO } from 'date-fns'

interface SpendingIncomeBarProps {
  data: MonthTrend[]
}

function formatK(value: number) {
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}k`
  return `$${Math.abs(value)}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const income = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0
  const spending = payload.find((p: any) => p.dataKey === 'spending')?.value ?? 0
  const net = income - spending
  return (
    <div className="chart-tooltip min-w-[140px]">
      <div className="text-white/60 text-xs mb-2 font-medium">{label}</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/40 text-xs">Income</span>
          <span className="font-money text-emerald-400 text-xs">{formatK(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/40 text-xs">Spending</span>
          <span className="font-money text-primary-400 text-xs">{formatK(spending)}</span>
        </div>
        <div className="section-divider my-1" />
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/50 text-xs font-medium">Net</span>
          <span className={`font-money text-xs font-semibold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {net >= 0 ? '+' : ''}{formatK(net)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SpendingIncomeBar({ data }: SpendingIncomeBarProps) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-white/30">No trend data</div>
  )

  const formatted = data.map(d => ({
    ...d,
    month: (() => { try { return format(parseISO(`${d.month}-01`), 'MMM') } catch { return d.month } })(),
    spending: Math.abs(d.spending),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={formatted} barCategoryGap="30%" barGap={3}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0.7} />
          </linearGradient>
          <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="0"
          stroke="rgba(255,255,255,0.04)"
          vertical={false}
          horizontalPoints={[]}
        />
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.04)"
          horizontal={true}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
          tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(124,58,237,0.06)', radius: 4 }} />
        <Bar dataKey="income" name="income" fill="url(#incomeGrad)" radius={[4, 4, 0, 0]}>
          {formatted.map((_, i) => (
            <Cell key={i} />
          ))}
        </Bar>
        <Bar dataKey="spending" name="spending" fill="url(#spendingGrad)" radius={[4, 4, 0, 0]}>
          {formatted.map((_, i) => (
            <Cell key={i} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
