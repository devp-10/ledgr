import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { MonthTrend } from '../../types'
import { format, parseISO } from 'date-fns'

interface TrendLineProps {
  data: MonthTrend[]
  targetRate?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  const isRate = payload[0]?.dataKey === 'savingsRate'
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-soft border border-border-light dark:border-border-dark p-3 text-sm">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className="font-money text-gray-900 dark:text-gray-100 font-semibold">
        {isRate ? `${val}%` : `$${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`}
      </div>
    </div>
  )
}

export function TrendLine({ data, targetRate }: TrendLineProps) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-gray-400">No trend data</div>
  )

  const formatted = data.map(d => ({
    month: (() => { try { return format(parseISO(`${d.month}-01`), 'MMM yy') } catch { return d.month } })(),
    spending: Math.abs(d.spending),
    income: d.income,
    savingsRate: d.income > 0 ? Math.round(((d.income - Math.abs(d.spending)) / d.income) * 100) : 0,
  }))

  const useRate = targetRate !== undefined
  const dataKey = useRate ? 'savingsRate' : 'spending'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C15F3C" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#C15F3C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" className="dark:stroke-white/[0.06]" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
          width={42}
          tickFormatter={v => useRate ? `${v}%` : `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        {targetRate !== undefined && (
          <ReferenceLine y={targetRate} stroke="#4a9d5b" strokeDasharray="5 4" label={{ value: `${targetRate}% target`, fill: '#4a9d5b', fontSize: 10 }} />
        )}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="#C15F3C"
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={{ r: 3, fill: '#C15F3C', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#C15F3C' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
