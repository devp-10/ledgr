import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
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
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const income = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0
  const spending = payload.find((p: any) => p.dataKey === 'spending')?.value ?? 0
  const net = income - spending
  return (
    <div className="bg-surface dark:bg-gray-800 rounded-lg shadow-soft border border-border-light dark:border-border-dark p-3 text-sm">
      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">Income</span>
          <span className="font-money text-status-positive">${income.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-500">Spending</span>
          <span className="font-money text-gray-700 dark:text-gray-300">${spending.toLocaleString()}</span>
        </div>
        <div className="border-t border-border-light dark:border-border-dark pt-1 mt-1 flex items-center justify-between gap-4">
          <span className="text-gray-500">Net</span>
          <span className={`font-money font-semibold ${net >= 0 ? 'text-status-positive' : 'text-status-negative'}`}>
            {net >= 0 ? '+' : ''}{net.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SpendingIncomeBar({ data }: SpendingIncomeBarProps) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-gray-400">No trend data</div>
  )

  const formatted = data.map(d => ({
    ...d,
    month: (() => { try { return format(parseISO(`${d.month}-01`), 'MMM') } catch { return d.month } })(),
    spending: Math.abs(d.spending),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={formatted} barCategoryGap="30%" barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" className="dark:stroke-white/[0.06]" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 12, fill: 'currentColor' }} className="text-gray-500 dark:text-gray-400" axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(v) => <span className="text-gray-600 dark:text-gray-400">{v === 'income' ? 'Income' : 'Spending'}</span>}
        />
        <Bar dataKey="income" name="income" fill="#4a9d5b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="spending" name="spending" fill="#C15F3C" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
