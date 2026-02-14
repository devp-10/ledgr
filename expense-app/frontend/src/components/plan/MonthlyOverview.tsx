import { DashboardSummary } from '../../types'
import { Progress } from '../ui/Progress'
import { Card, CardContent } from '../ui/Card'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface MonthlyOverviewProps {
  summary: DashboardSummary | null
  totalBudgeted: number
  loading?: boolean
}

function StatBox({
  label, value, icon, colorClass
}: { label: string; value: string; icon: React.ReactNode; colorClass: string }) {
  return (
    <div className="flex-1 flex flex-col gap-1 min-w-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
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
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="flex gap-4">
            {[1,2,3].map(i => <div key={i} className="flex-1 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />)}
          </div>
          <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full" />
        </div>
      </Card>
    )
  }

  const income = summary?.total_income ?? 0
  const spending = Math.abs(summary?.total_spending ?? 0)
  const remaining = income - spending
  const budgetPct = totalBudgeted > 0 ? (spending / totalBudgeted) * 100 : 0

  return (
    <Card gradient>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between gap-4 mb-5">
          <StatBox
            label="Total Income"
            value={formatMoney(income)}
            icon={<TrendingUp size={16} className="text-success-600 dark:text-success-400" />}
            colorClass="bg-success-500/10"
          />
          <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
          <StatBox
            label="Total Budgeted"
            value={formatMoney(totalBudgeted)}
            icon={<Wallet size={16} className="text-primary-600 dark:text-primary-400" />}
            colorClass="bg-primary-500/10"
          />
          <div className="w-px h-12 bg-gray-200 dark:bg-gray-700" />
          <StatBox
            label="Remaining"
            value={formatMoney(remaining)}
            icon={<TrendingDown size={16} className={remaining >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-500'} />}
            colorClass={remaining >= 0 ? 'bg-success-500/10' : 'bg-danger-500/10'}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Overall spending progress</span>
            <span className="font-money font-medium">
              {formatMoney(spending)} / {formatMoney(totalBudgeted)}
            </span>
          </div>
          <Progress value={budgetPct} size="md" showLabel />
        </div>
      </CardContent>
    </Card>
  )
}
