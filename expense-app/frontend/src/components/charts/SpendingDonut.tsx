import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SpendingCategory } from '../../lib/api'

const COLORS = [
  '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#a855f7',
]

interface Props {
  data: SpendingCategory[]
}

export function SpendingDonut({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        No spending data for this period
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={75}
          outerRadius={120}
          dataKey="amount"
          nameKey="category"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
          contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}
        />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-gray-700 dark:text-gray-300">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
