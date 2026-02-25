import { BudgetGroup, SpendingCategory } from '../../types'
import { CategoryDonut } from '../charts/CategoryDonut'
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

export function PlanCharts({ groups, spendingData, totalSpending, loading }: PlanChartsProps) {
  // Compute group-level activity by summing spending for each category in the group
  const groupStats = groups.map(g => {
    const assigned = g.categories.reduce((sum, c) => sum + c.budget_amount, 0)
    const activity = g.categories.reduce((sum, c) => {
      const s = spendingData.find(d => d.category === c.name)
      return sum + (s ? Math.abs(s.amount) : 0)
    }, 0)
    return { id: g.id, name: g.name, assigned, activity }
  }).filter(g => g.assigned > 0 || g.activity > 0)

  return (
    <div className="space-y-4">
      {/* Spending Breakdown */}
      <Card>
        <CardContent className="pt-4 pb-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
            Spending This Month
          </p>
          {loading ? (
            <div className="h-52 skeleton rounded-lg" />
          ) : (
            <CategoryDonut data={spendingData} total={totalSpending} />
          )}
        </CardContent>
      </Card>

      {/* Budget by Group */}
      <Card>
        <CardContent className="pt-4 pb-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
            Budget by Group
          </p>
          {loading || groupStats.length === 0 ? (
            loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 skeleton rounded w-3/4" />
                    <div className="h-1.5 skeleton rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                Add budget amounts to see group progress
              </p>
            )
          ) : (
            <div className="space-y-3">
              {groupStats.map(g => {
                const pct = g.assigned > 0 ? (g.activity / g.assigned) * 100 : 0
                const over = g.activity > g.assigned
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{g.name}</span>
                      <span className={clsx(
                        'text-xs font-money flex-shrink-0',
                        over ? 'text-status-negative' : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {formatMoney(g.activity)}
                        <span className="text-gray-400 dark:text-gray-600"> / {formatMoney(g.assigned)}</span>
                      </span>
                    </div>
                    <Progress value={g.activity} max={g.assigned} size="sm" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
