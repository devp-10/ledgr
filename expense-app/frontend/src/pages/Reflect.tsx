import { useState, useEffect } from 'react'
import { format, subMonths, parseISO } from 'date-fns'
import { api } from '../lib/api'
import { DashboardSummary } from '../types'
import { SummaryCards } from '../components/reflect/SummaryCards'
import { TopExpenses } from '../components/reflect/TopExpenses'
import { ComparisonTable } from '../components/reflect/ComparisonTable'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { SpendingIncomeBar } from '../components/charts/SpendingIncomeBar'
import { TrendLine } from '../components/charts/TrendLine'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { MonthPicker } from '../components/common/MonthPicker'
import { useToastContext } from '../App'

export function Reflect() {
  const addToast = useToastContext()
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [current, setCurrent] = useState<DashboardSummary | null>(null)
  const [previous, setPrevious] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const prevMonth = format(subMonths(parseISO(`${month}-01`), 1), 'yyyy-MM')

    Promise.all([
      api.getDashboard(month),
      api.getDashboard(prevMonth),
    ])
      .then(([curr, prev]) => {
        setCurrent(curr)
        setPrevious(prev)
      })
      .catch(() => addToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false))
  }, [month]) // eslint-disable-line

  const totalSpending = Math.abs(current?.total_spending ?? 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <MonthPicker value={month} onChange={setMonth} />
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Comparing to previous month
        </div>
      </div>

      {/* Overview */}
      <SummaryCards current={current} previous={previous} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle>Spending vs Income (6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingIncomeBar data={current?.monthly_trend ?? []} />
        </CardContent>
      </Card>

      {/* Spending Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 skeleton" />
            ) : (
              <CategoryDonut
                data={current?.spending_by_category ?? []}
                total={totalSpending}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine data={current?.monthly_trend ?? []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Expenses This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <TopExpenses
            transactions={current?.recent_transactions ?? []}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle>Category Comparison: This Month vs Last Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ComparisonTable
            current={current?.spending_by_category ?? []}
            previous={previous?.spending_by_category ?? []}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Savings & Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Savings Rate Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLine data={current?.monthly_trend ?? []} targetRate={30} />
          {!loading && current && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border-light dark:border-border-dark">
              {[
                {
                  label: 'This Month',
                  value: current.total_income > 0
                    ? `${Math.round(((current.total_income - Math.abs(current.total_spending)) / current.total_income) * 100)}%`
                    : 'N/A',
                },
                {
                  label: 'Income',
                  value: '$' + current.total_income.toLocaleString('en-US', { maximumFractionDigits: 0 }),
                },
                {
                  label: 'Net Flow',
                  value: (current.net_cash_flow >= 0 ? '+$' : '-$') +
                    Math.abs(current.net_cash_flow).toLocaleString('en-US', { maximumFractionDigits: 0 }),
                },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-lg font-bold font-money text-gray-900 dark:text-gray-100 mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
