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

function Delta({ value, invert = false, suffix = '%' }: { value: number; invert?: boolean; suffix?: string }) {
  const pct = Math.abs(Math.round(value * 10) / 10)
  const isPositive = invert ? value < 0 : value > 0
  const isZero = value === 0

  if (isZero) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus size={10} /> 0{suffix}</span>

  return (
    <span className={clsx(
      'text-xs font-medium flex items-center gap-0.5',
      isPositive ? 'text-status-positive' : 'text-status-negative'
    )}>
      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {pct}{suffix}
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
  deltaSuffix?: string
  icon: React.ReactNode
  iconColor: string
  loading?: boolean
}

function StatCard({ title, value, delta, invertDelta, deltaSuffix, icon, iconColor, loading }: StatCardProps) {
  if (loading) return (
    <div className="bg-surface dark:bg-[#171717] border border-border-light dark:border-border-dark rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-lg skeleton" />
        <div className="w-12 h-4 skeleton" />
      </div>
      <div className="h-8 skeleton w-3/4 mb-1.5" />
      <div className="h-3 skeleton w-1/2" />
    </div>
  )

  return (
    <div className="bg-surface dark:bg-[#171717] border border-border-light dark:border-border-dark rounded-lg p-5 hover:shadow-soft transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', iconColor)}>
          {icon}
        </div>
        {delta !== undefined && <Delta value={delta} invert={invertDelta} suffix={deltaSuffix} />}
      </div>
      <p className="text-2xl font-bold font-money text-gray-900 dark:text-gray-100 tracking-tight">
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{title}</p>
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
  const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevSpending) / prevIncome) * 100 : 0
  const savingsRateDelta = previous ? savingsRate - prevSavingsRate : undefined

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Income"
        value={formatMoney(income)}
        delta={pctChange(income, prevIncome)}
        icon={<TrendingUp size={16} className="text-status-positive" />}
        iconColor="bg-status-positive-bg dark:bg-emerald-900/30"
        loading={loading}
      />
      <StatCard
        title="Total Spending"
        value={formatMoney(spending)}
        delta={pctChange(spending, prevSpending)}
        invertDelta
        icon={<TrendingDown size={16} className="text-accent-500" />}
        iconColor="bg-accent-500/10"
        loading={loading}
      />
      <StatCard
        title="Net Cash Flow"
        value={(net >= 0 ? '+' : '-') + formatMoney(net)}
        icon={net >= 0
          ? <ArrowUpRight size={16} className="text-status-positive" />
          : <ArrowDownRight size={16} className="text-status-negative" />}
        iconColor={net >= 0 ? 'bg-status-positive-bg dark:bg-emerald-900/30' : 'bg-status-negative-bg dark:bg-red-900/30'}
        loading={loading}
      />
      <StatCard
        title="Savings Rate"
        value={`${Math.max(0, Math.round(savingsRate))}%`}
        delta={savingsRateDelta}
        deltaSuffix="pp"
        icon={<PiggyBank size={16} className="text-accent-500" />}
        iconColor="bg-accent-500/10"
        loading={loading}
      />
    </div>
  )
}
