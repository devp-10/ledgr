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

  if (isZero) return <span className="text-xs text-white/30 flex items-center gap-0.5"><Minus size={10} /> 0%</span>

  return (
    <span className={clsx(
      'text-xs font-medium flex items-center gap-0.5',
      isPositive ? 'text-emerald-400' : 'text-red-400'
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
  iconColor: string
  valueClass?: string
  loading?: boolean
}

function StatCard({ title, value, delta, invertDelta, icon, iconColor, valueClass, loading }: StatCardProps) {
  if (loading) return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl skeleton" />
        <div className="w-12 h-4 skeleton" />
      </div>
      <div className="h-8 skeleton w-3/4 mb-1.5" />
      <div className="h-3 skeleton w-1/2" />
    </div>
  )

  return (
    <div className="glass glass-hover rounded-2xl p-5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          iconColor
        )}>
          {icon}
        </div>
        {delta !== undefined && <Delta value={delta} invert={invertDelta} />}
      </div>
      <p className={clsx(
        'text-2xl font-bold font-money animate-count-up tracking-tight',
        valueClass ?? 'gradient-text'
      )}>
        {value}
      </p>
      <p className="text-xs text-white/30 mt-1">{title}</p>
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        title="Total Income"
        value={formatMoney(income)}
        delta={pctChange(income, prevIncome)}
        icon={<TrendingUp size={16} className="text-emerald-400" />}
        iconColor="bg-emerald-500/15"
        valueClass="gradient-text-income"
        loading={loading}
      />
      <StatCard
        title="Total Spending"
        value={formatMoney(spending)}
        delta={pctChange(spending, prevSpending)}
        invertDelta
        icon={<TrendingDown size={16} className="text-primary-400" />}
        iconColor="bg-primary-500/15"
        loading={loading}
      />
      <StatCard
        title="Net Cash Flow"
        value={(net >= 0 ? '+' : '-') + formatMoney(net)}
        icon={net >= 0
          ? <ArrowUpRight size={16} className="text-emerald-400" />
          : <ArrowDownRight size={16} className="text-red-400" />}
        iconColor={net >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}
        valueClass={net >= 0 ? 'gradient-text-income' : 'gradient-text-danger'}
        loading={loading}
      />
      <StatCard
        title="Savings Rate"
        value={`${Math.max(0, Math.round(savingsRate))}%`}
        icon={<PiggyBank size={16} className="text-accent-400" />}
        iconColor="bg-accent-500/15"
        valueClass={savingsRate >= 20 ? 'gradient-text-income' : 'gradient-text'}
        loading={loading}
      />
    </div>
  )
}
