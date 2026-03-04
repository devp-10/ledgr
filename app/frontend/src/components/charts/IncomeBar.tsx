import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { MonthTrend } from '../../lib/api'
import { format, parseISO } from 'date-fns'

interface IncomeBarProps {
  data: MonthTrend[]
}

const GREEN = '#4a9d5b'

function fmtK(v: number) {
  return `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const income = payload[0]?.value ?? 0
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-soft border border-border-light dark:border-border-dark p-3 text-sm">
      <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</div>
      <div className="font-money font-semibold text-status-positive">{fmtK(income)}</div>
    </div>
  )
}

export function IncomeBar({ data }: IncomeBarProps) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-52 text-sm text-gray-400">No income data</div>
  )

  const chartData = data.map(d => ({
    month: (() => { try { return format(parseISO(`${d.month}-01`), 'MMM yy') } catch { return d.month } })(),
    income: d.income,
  }))

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
        <Bar dataKey="income" fill={GREEN} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
