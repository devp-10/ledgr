import { CheckCircle2 } from 'lucide-react'
import { BudgetGroup, SpendingCategory } from '../../types'
import { Progress } from '../ui/Progress'
import { Card, CardContent } from '../ui/Card'
import { clsx } from 'clsx'

interface PlanChartsProps {
  groups: BudgetGroup[]
  spendingData: SpendingCategory[]
  totalSpending: number
  loading?: boolean
}

function formatMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface CategoryVariance {
  emoji: string
  name: string
  budgeted: number
  spent: number
  variance: number // positive = surplus, negative = overage
}

export function PlanCharts({ groups, spendingData, totalSpending, loading }: PlanChartsProps) {
  const totalBudgeted = groups.flatMap(g => g.categories).reduce((s, c) => s + c.budget_amount, 0)

  // Build per-category variance list
  const variances: CategoryVariance[] = groups.flatMap(g =>
    g.categories
      .filter(c => c.budget_amount > 0)
      .map(c => {
        const s = spendingData.find(d => d.category === c.name)
        const spent = s ? Math.abs(s.amount) : 0
        return { emoji: c.emoji, name: c.name, budgeted: c.budget_amount, spent, variance: c.budget_amount - spent }
      })
  )

  const overBudget = variances.filter(v => v.variance < 0).sort((a, b) => a.variance - b.variance).slice(0, 5)
  const surplus    = variances.filter(v => v.variance > 0).sort((a, b) => b.variance - a.variance).slice(0, 5)

  const diff = totalBudgeted - totalSpending
  const overallOver = diff < 0

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="pt-4 pb-5">
              <div className="h-24 skeleton rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const hasData = totalSpending > 0 || totalBudgeted > 0

  return (
    <div className="space-y-4">

      {/* Card 1: Budget vs Actual */}
      <Card>
        <CardContent className="pt-4 pb-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Budget vs Actual
          </p>
          {!hasData ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No data for this month yet.</p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Budgeted</span>
                <span className="font-money text-gray-700 dark:text-gray-300">{formatMoney(totalBudgeted)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Spent</span>
                <span className="font-money text-gray-900 dark:text-gray-100">{formatMoney(totalSpending)}</span>
              </div>
              <Progress value={totalSpending} max={totalBudgeted || 1} size="md" />
              <div className={clsx(
                'flex items-center justify-between rounded-lg px-3 py-2',
                overallOver
                  ? 'bg-status-negative-bg dark:bg-red-900/20'
                  : 'bg-status-positive-bg dark:bg-emerald-900/20'
              )}>
                <span className={clsx(
                  'text-xs font-medium',
                  overallOver ? 'text-status-negative' : 'text-status-positive'
                )}>
                  {overallOver ? 'Over budget' : 'Under budget'}
                </span>
                <span className={clsx(
                  'text-sm font-bold font-money',
                  overallOver ? 'text-status-negative' : 'text-status-positive'
                )}>
                  {overallOver ? '+' : ''}{formatMoney(Math.abs(diff))}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Card 2: Over Budget */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Over Budget
          </p>
          {overBudget.length === 0 ? (
            <div className="flex items-center gap-2 py-2 text-status-positive">
              <CheckCircle2 size={15} />
              <span className="text-sm">All categories on track</span>
            </div>
          ) : (
            overBudget.map(v => (
              <div key={v.name} className="flex items-center gap-2 py-1.5">
                <span className="text-sm flex-shrink-0">{v.emoji}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{v.name}</span>
                <span className="text-xs font-money text-status-negative flex-shrink-0">
                  +{formatMoney(Math.abs(v.variance))} over
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Card 3: Surplus */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Surplus
          </p>
          {surplus.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">No surplus categories.</p>
          ) : (
            surplus.map(v => (
              <div key={v.name} className="flex items-center gap-2 py-1.5">
                <span className="text-sm flex-shrink-0">{v.emoji}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{v.name}</span>
                <span className="text-xs font-money text-status-positive flex-shrink-0">
                  {formatMoney(v.variance)} left
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  )
}
