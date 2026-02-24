import { DashboardSummary } from '../../types'
import { Card, CardContent } from '../ui/Card'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface MonthlyOverviewProps {
  summary: DashboardSummary | null
  totalBudgeted: number
  loading?: boolean
}

function StatBox({
  label, value, icon, iconColor
}: { label: string; value: string; icon: React.ReactNode; iconColor: string }) {
  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      <p className="text-xl font-bold font-money text-gray-900 dark:text-gray-100 truncate">{value}</p>
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
            {[1, 2, 3].map(i => <div key={i} className="flex-1 h-16 skeleton" />)}
          </div>
        </div>
      </Card>
    )
  }

  const income = summary?.total_income ?? 0
  const spending = Math.abs(summary?.total_spending ?? 0)
  const remaining = income - spending

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-4">
          <StatBox
            label="Total Income"
            value={formatMoney(income)}
            icon={<TrendingUp size={16} className="text-status-positive" />}
            iconColor="bg-status-positive-bg dark:bg-emerald-900/30"
          />
          <div className="w-px h-12 bg-border-light dark:bg-border-dark" />
          <StatBox
            label="Total Budgeted"
            value={formatMoney(totalBudgeted)}
            icon={<Wallet size={16} className="text-accent-500" />}
            iconColor="bg-accent-500/10"
          />
          <div className="w-px h-12 bg-border-light dark:bg-border-dark" />
          <StatBox
            label="Remaining"
            value={formatMoney(remaining)}
            icon={<TrendingDown size={16} className={remaining >= 0 ? 'text-status-positive' : 'text-status-negative'} />}
            iconColor={remaining >= 0 ? 'bg-status-positive-bg dark:bg-emerald-900/30' : 'bg-status-negative-bg dark:bg-red-900/30'}
          />
        </div>
      </CardContent>
    </Card>
  )
}
