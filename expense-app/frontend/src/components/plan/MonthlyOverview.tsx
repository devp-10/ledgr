import { DashboardSummary } from '../../types'
import { Progress } from '../ui/Progress'
import { Card, CardContent } from '../ui/Card'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { clsx } from 'clsx'

interface MonthlyOverviewProps {
  summary: DashboardSummary | null
  totalBudgeted: number
  loading?: boolean
}

function StatBox({
  label, value, icon, iconColor, valueClass
}: { label: string; value: string; icon: React.ReactNode; iconColor: string; valueClass?: string }) {
  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center', iconColor)}>
        {icon}
      </div>
      <p className="text-xs text-white/30 mt-1">{label}</p>
      <p className={clsx('text-xl font-bold font-money truncate tracking-tight', valueClass ?? 'gradient-text')}>{value}</p>
    </div>
  )
}

function formatMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function MonthlyOverview({ summary, totalBudgeted, loading }: MonthlyOverviewProps) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="space-y-4">
          <div className="flex gap-4">
            {[1,2,3].map(i => <div key={i} className="flex-1 h-16 skeleton" />)}
          </div>
          <div className="h-2 skeleton" />
        </div>
      </Card>
    )
  }

  const income = summary?.total_income ?? 0
  const spending = Math.abs(summary?.total_spending ?? 0)
  const remaining = income - spending
  const budgetPct = totalBudgeted > 0 ? (spending / totalBudgeted) * 100 : 0

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-4 mb-5">
          <StatBox
            label="Total Income"
            value={formatMoney(income)}
            icon={<TrendingUp size={16} className="text-emerald-400" />}
            iconColor="bg-emerald-500/15"
            valueClass="gradient-text-income"
          />
          <div className="w-px h-12 bg-white/06" />
          <StatBox
            label="Total Budgeted"
            value={formatMoney(totalBudgeted)}
            icon={<Wallet size={16} className="text-primary-400" />}
            iconColor="bg-primary-500/15"
          />
          <div className="w-px h-12 bg-white/06" />
          <StatBox
            label="Remaining"
            value={formatMoney(remaining)}
            icon={<TrendingDown size={16} className={remaining >= 0 ? 'text-emerald-400' : 'text-red-400'} />}
            iconColor={remaining >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}
            valueClass={remaining >= 0 ? 'gradient-text-income' : 'gradient-text-danger'}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>Spending progress</span>
            <span className="font-money">
              {formatMoney(spending)} / {formatMoney(totalBudgeted)}
            </span>
          </div>
          <Progress value={budgetPct} size="md" showLabel />
        </div>
      </CardContent>
    </Card>
  )
}
