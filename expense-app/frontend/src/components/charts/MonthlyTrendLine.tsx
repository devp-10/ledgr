import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { MonthTrend } from '../../lib/api'

interface Props {
  data: MonthTrend[]
}

function formatMonth(m: string) {
  const [year, month] = m.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function MonthlyTrendLine({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        No trend data available
      </div>
    )
  }

  const formatted = data.map(d => ({ ...d, month: formatMonth(d.month) }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
        />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`]}
          contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="spending"
          name="Spending"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
