import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PiggyBank, Minus } from 'lucide-react'
import { DashboardSummary } from '../../types'
import { clsx } from 'clsx'

interface SummaryCardsProps {
  current: DashboardSummary | null
  previous: DashboardSummary | null
  loading?: boolean
}

function formatMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  const pct = Math.abs(Math.round(value * 10) / 10)
  const isPositive = invert ? value < 0 : value > 0
  const isZero = value === 0

  if (isZero) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus size={10} /> 0%</span>

  return (
    <span className={clsx(
      'text-xs font-medium flex items-center gap-0.5',
      isPositive ? 'text-success-500' : 'text-danger-500'
    )}>
      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {pct}%
    </span>
  )
}

function pctChange(curr: number, prev: number): number {
  if (!prev) return 0
  return ((curr - prev) / Math.abs(prev)) * 100
}

interface StatCardProps {
  title: string
  value: string
  delta?: number
  invertDelta?: boolean
  icon: React.ReactNode
  iconBg: string
  valueColor?: string
  loading?: boolean
}

function StatCard({ title, value, delta, invertDelta, icon, iconBg, valueColor, loading }: StatCardProps) {
  if (loading) return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700" />
        <div className="w-10 h-4 rounded bg-gray-100 dark:bg-gray-700" />
      </div>
      <div className="h-7 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mt-1" />
    </div>
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        {delta !== undefined && <Delta value={delta} invert={invertDelta} />}
      </div>
      <p className={clsx('text-2xl font-bold font-money animate-count-up', valueColor ?? 'text-gray-900 dark:text-gray-100')}>
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
    </div>
  )
}

export function SummaryCards({ current, previous, loading }: SummaryCardsProps) {
  const income = current?.total_income ?? 0
  const spending = Math.abs(current?.total_spending ?? 0)
  const prevIncome = previous?.total_income ?? 0
  const prevSpending = Math.abs(previous?.total_spending ?? 0)
  const net = income - spending
  const savingsRate = income > 0 ? ((income - spending) / income) * 100 : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Income"
        value={formatMoney(income)}
        delta={pctChange(income, prevIncome)}
        icon={<TrendingUp size={16} className="text-success-600 dark:text-success-400" />}
        iconBg="bg-success-500/10"
        valueColor="text-success-600 dark:text-success-400"
        loading={loading}
      />
      <StatCard
        title="Total Spending"
        value={formatMoney(spending)}
        delta={pctChange(spending, prevSpending)}
        invertDelta
        icon={<TrendingDown size={16} className="text-primary-600 dark:text-primary-400" />}
        iconBg="bg-primary-500/10"
        loading={loading}
      />
      <StatCard
        title="Net Cash Flow"
        value={(net >= 0 ? '+' : '-') + formatMoney(net)}
        icon={net >= 0
          ? <ArrowUpRight size={16} className="text-success-600 dark:text-success-400" />
          : <ArrowDownRight size={16} className="text-danger-500" />}
        iconBg={net >= 0 ? 'bg-success-500/10' : 'bg-danger-500/10'}
        valueColor={net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-500'}
        loading={loading}
      />
      <StatCard
        title="Savings Rate"
        value={`${Math.max(0, Math.round(savingsRate))}%`}
        icon={<PiggyBank size={16} className="text-accent-500 dark:text-accent-400" />}
        iconBg="bg-accent-500/10"
        valueColor={savingsRate >= 20 ? 'text-success-600 dark:text-success-400' : 'text-gray-900 dark:text-gray-100'}
        loading={loading}
      />
    </div>
  )
}
