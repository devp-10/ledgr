import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { MonthTrend } from '../../lib/api'
import { format, parseISO } from 'date-fns'

export type TrendMode = 'spending' | 'income' | 'savingsRate'

interface TrendLineProps {
  data: MonthTrend[]
  compareData?: MonthTrend[]
  mode?: TrendMode
  targetRate?: number
}

const MAIN_COLOR = '#C15F3C'
const COMPARE_COLOR = '#94a3b8'

function toLabel(month: string) {
  try { return format(parseISO(`${month}-01`), 'MMM yy') } catch { return month }
}

function calcSavingsRate(t: MonthTrend) {
  return t.income > 0 ? Math.round(((t.income - Math.abs(t.spending)) / t.income) * 100) : 0
}

function getValue(t: MonthTrend, mode: TrendMode) {
  if (mode === 'income') return t.income
  if (mode === 'savingsRate') return calcSavingsRate(t)
  return Math.abs(t.spending)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label, isRate }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-soft border border-border-light dark:border-border-dark p-3 text-sm">
      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1.5">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="font-money font-semibold text-gray-900 dark:text-gray-100">
            {isRate ? `${p.value}%` : `$${p.value >= 1000 ? (p.value / 1000).toFixed(1) + 'k' : p.value}`}
          </span>
          {p.dataKey === 'compareValue' && (
            <span className="text-gray-400">prev period</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function TrendLine({ data, compareData, mode = 'spending', targetRate }: TrendLineProps) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-gray-400">No trend data</div>
  )

  const isRate = mode === 'savingsRate' || targetRate !== undefined
  const hasCompare = compareData && compareData.length > 0

  const chartData = data.map((d, i) => {
    const prev = compareData?.[i]
    return {
      month: toLabel(d.month),
      value: getValue(d, mode),
      ...(prev !== undefined ? { compareValue: getValue(prev, mode) } : {}),
    }
  })

  const formatY = (v: number) =>
    isRate ? `${v}%` : `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`fill-${mode}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={MAIN_COLOR} stopOpacity={0.18} />
            <stop offset="100%" stopColor={MAIN_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tick={{ fontSize: 11, fill: 'currentColor' }}
          className="text-gray-500 dark:text-gray-400"
          axisLine={false}
          tickLine={false}
          width={42}
          tickFormatter={formatY}
        />
        <Tooltip content={(props: any) => <CustomTooltip {...props} isRate={isRate} />} />
        {targetRate !== undefined && (
          <ReferenceLine
            y={targetRate}
            stroke="#4a9d5b"
            strokeDasharray="5 4"
            label={{ value: `${targetRate}% target`, fill: '#4a9d5b', fontSize: 10 }}
          />
        )}
        {hasCompare && (
          <Line
            type="monotone"
            dataKey="compareValue"
            stroke={COMPARE_COLOR}
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, fill: COMPARE_COLOR, strokeWidth: 0 }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke={MAIN_COLOR}
          strokeWidth={2}
          fill={`url(#fill-${mode})`}
          dot={{ r: 3, fill: MAIN_COLOR, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: MAIN_COLOR, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
