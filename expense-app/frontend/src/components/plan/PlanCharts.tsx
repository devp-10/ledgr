import { BudgetGroup, SpendingCategory } from '../../types'
import { Progress } from '../ui/Progress'
import { Card, CardContent } from '../ui/Card'
import { clsx } from 'clsx'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'

interface PlanChartsProps {
  groups: BudgetGroup[]
  spendingData: SpendingCategory[]
  totalSpending: number
  loading?: boolean
}

function formatMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function formatMoneyAxis(n: number) {
  if (n >= 1000) return '$' + (n / 1000).toFixed(0) + 'k'
  return '$' + n
}

interface CategoryVariance {
  emoji: string
  name: string
  label: string
  budgeted: number
  spent: number
  variance: number
}

const BUDGET_COLOR = '#94a3b8'   // slate-400
const ACTUAL_OVER  = '#f87171'   // red-400
const ACTUAL_OK    = '#34d399'   // emerald-400

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const budgeted = payload.find((p: any) => p.dataKey === 'budgeted')?.value ?? 0
  const spent    = payload.find((p: any) => p.dataKey === 'spent')?.value ?? 0
  const over     = spent > budgeted
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-xs space-y-1 min-w-[130px]">
      <p className="font-semibold text-gray-700 dark:text-gray-300">{label}</p>
      <p className="text-gray-500 dark:text-gray-400">Budgeted: <span className="font-money">{formatMoney(budgeted)}</span></p>
      <p className={over ? 'text-status-negative' : 'text-status-positive'}>
        Actual: <span className="font-money">{formatMoney(spent)}</span>
      </p>
    </div>
  )
}

export function PlanCharts({ groups, spendingData, totalSpending, loading }: PlanChartsProps) {
  const totalBudgeted = groups.flatMap(g => g.categories).reduce((s, c) => s + c.budget_amount, 0)

  const variances: CategoryVariance[] = groups
    .flatMap(g =>
      g.categories
        .filter(c => c.budget_amount > 0 || spendingData.find(d => d.category === c.name))
        .map(c => {
          const s     = spendingData.find(d => d.category === c.name)
          const spent = s ? Math.abs(s.amount) : 0
          return {
            emoji:    c.emoji,
            name:     c.name,
            label:    c.emoji ? `${c.emoji} ${c.name}` : c.name,
            budgeted: c.budget_amount,
            spent,
            variance: c.budget_amount - spent,
          }
        })
    )
    .sort((a, b) => b.spent - a.spent)  // highest actual first

  const diff       = totalBudgeted - totalSpending
  const overallOver = diff < 0
  const hasData    = totalSpending > 0 || totalBudgeted > 0

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="pt-4 pb-5">
              <div className="h-24 skeleton rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Card 1: Budget vs Actual summary */}
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

      {/* Card 2: Horizontal double bar chart — Budget vs Actual by subcategory */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            By Category
          </p>
          {!hasData || variances.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No data for this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={variances.length * 40 + 32}>
              <BarChart
                layout="vertical"
                data={variances}
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                barCategoryGap="25%"
                barGap={2}
              >
                <XAxis
                  type="number"
                  tickFormatter={formatMoneyAxis}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  formatter={(value) => value === 'budgeted' ? 'Budgeted' : 'Actual'}
                />
                <Bar dataKey="budgeted" name="budgeted" fill={BUDGET_COLOR} radius={[0, 3, 3, 0]} />
                <Bar dataKey="spent" name="spent" radius={[0, 3, 3, 0]}>
                  {variances.map((v) => (
                    <Cell
                      key={v.name}
                      fill={v.spent > v.budgeted ? ACTUAL_OVER : ACTUAL_OK}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
