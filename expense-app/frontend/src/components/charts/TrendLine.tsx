import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { MonthTrend } from '../../types'
import { format, parseISO } from 'date-fns'

interface TrendLineProps {
  data: MonthTrend[]
  targetRate?: number // optional savings rate target (0-100)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 text-sm">
      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</div>
      <div className="font-money text-primary-600 dark:text-primary-400">
        ${val.toLocaleString()}
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
  const strokeColor = '#8B5CF6'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={strokeColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={v => useRate ? `${v}%` : `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        {targetRate !== undefined && (
          <ReferenceLine y={targetRate} stroke="#10B981" strokeDasharray="5 4" label={{ value: `${targetRate}% target`, fill: '#10B981', fontSize: 10 }} />
        )}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={strokeColor}
          strokeWidth={2}
          fill="url(#trendGradient)"
          dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: strokeColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
