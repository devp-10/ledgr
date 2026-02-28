import { useState, useEffect, useMemo } from 'react'
import { format, subMonths, startOfYear } from 'date-fns'
import { api } from '../lib/api'
import { Select } from '../components/ui/Select'
import type { DashboardSummary, MonthTrend } from '../lib/api'
import { SummaryCards } from '../components/reflect/SummaryCards'
import { SavingsRatePanel } from '../components/reflect/SavingsRatePanel'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { NetCashFlowBar } from '../components/charts/NetCashFlowBar'
import { SpendingCategoryBar } from '../components/charts/SpendingCategoryBar'
import { IncomeBar } from '../components/charts/IncomeBar'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { useToastContext } from '../App'

// ─── Period types ─────────────────────────────────────────────────────────────

type PeriodKey = 'this_year' | 'last_month' | 'last_3_months' | 'last_6_months'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'this_year', label: 'This Year' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'last_6_months', label: 'Last 6 Months' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the list of completed months for a given period.
 * "Last Month/3/6" exclude the current in-progress month.
 * "This Year" includes up to the current month.
 */
function getPeriodMonths(period: PeriodKey, now: Date): string[] {
  switch (period) {
    case 'this_year': {
      const year = now.getFullYear()
      const months: string[] = []
      for (let m = 0; m <= now.getMonth(); m++) {
        months.push(format(new Date(year, m, 1), 'yyyy-MM'))
      }
      return months
    }
    case 'last_month':
      return [format(subMonths(now, 1), 'yyyy-MM')]
    case 'last_3_months':
      return [3, 2, 1].map(n => format(subMonths(now, n), 'yyyy-MM'))
    case 'last_6_months':
      return [6, 5, 4, 3, 2, 1].map(n => format(subMonths(now, n), 'yyyy-MM'))
  }
}

/**
 * Returns equivalent previous-period months for comparison.
 * Shifts the period back by its own length.
 */
function getPrevPeriodMonths(period: PeriodKey, now: Date): string[] {
  switch (period) {
    case 'this_year': {
      const prevYear = now.getFullYear() - 1
      const months: string[] = []
      for (let m = 0; m <= now.getMonth(); m++) {
        months.push(format(new Date(prevYear, m, 1), 'yyyy-MM'))
      }
      return months
    }
    case 'last_month':
      return [format(subMonths(now, 2), 'yyyy-MM')]
    case 'last_3_months':
      return [6, 5, 4].map(n => format(subMonths(now, n), 'yyyy-MM'))
    case 'last_6_months':
      return [12, 11, 10, 9, 8, 7].map(n => format(subMonths(now, n), 'yyyy-MM'))
  }
}

/** Deduplicate + sort a combined trend array by month */
function mergeTrends(a: MonthTrend[], b: MonthTrend[]): MonthTrend[] {
  const map = new Map<string, MonthTrend>()
  ;[...a, ...b].forEach(t => map.set(t.month, t))
  return [...map.values()].sort((x, y) => x.month.localeCompare(y.month))
}

function aggregateTrend(trend: MonthTrend[]) {
  const totalIncome = trend.reduce((s, t) => s + t.income, 0)
  const totalSpending = trend.reduce((s, t) => s + Math.abs(t.spending), 0)
  return { totalIncome, totalSpending, net: totalIncome - totalSpending }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Reflect() {
  const addToast = useToastContext()
  const [period, setPeriod] = useState<PeriodKey>('this_year')
  const [compare, setCompare] = useState(false)

  // Main dashboard data for category breakdown (most recent period month)
  const [mainData, setMainData] = useState<DashboardSummary | null>(null)
  // All trend data (~13 months) built by merging two dashboard fetches
  const [allTrend, setAllTrend] = useState<MonthTrend[]>([])
  // Per-month data for stacked category bar chart
  const [periodMonthlyData, setPeriodMonthlyData] = useState<DashboardSummary[]>([])

  const [loading, setLoading] = useState(true)
  const [catLoading, setCatLoading] = useState(true)

  const now = useMemo(() => new Date(), [])
  const periodMonths = useMemo(() => getPeriodMonths(period, now), [period, now])
  const prevPeriodMonths = useMemo(() => getPrevPeriodMonths(period, now), [period, now])

  // ── Main fetch: trend + anchor category data ────────────────────────────────
  useEffect(() => {
    setLoading(true)
    setMainData(null)

    // Anchor = most recent month in period (for spending_by_category)
    const anchorMonth = periodMonths[periodMonths.length - 1]
    // Old month = far enough back to cover comparison periods
    const oldMonth = format(subMonths(now, 13), 'yyyy-MM')

    Promise.all([
      api.getDashboard(anchorMonth),
      api.getDashboard(oldMonth),
    ])
      .then(([curr, old]) => {
        setMainData(curr)
        setAllTrend(mergeTrends(old.monthly_trend, curr.monthly_trend))
      })
      .catch(() => addToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false))
  }, [period]) // eslint-disable-line

  // ── Per-month category fetch for stacked spending bar ──────────────────────
  useEffect(() => {
    if (!periodMonths.length) return
    setCatLoading(true)

    // For single-month period, we already have the data from mainData; still
    // fetch via this effect to keep logic uniform.
    Promise.all(periodMonths.map(m => api.getDashboard(m)))
      .then(setPeriodMonthlyData)
      .catch(() => { /* non-critical */ })
      .finally(() => setCatLoading(false))
  }, [periodMonths.join(',')]) // eslint-disable-line

  // ── Derived trend slices ───────────────────────────────────────────────────
  const currentTrend = useMemo(
    () => allTrend.filter(t => periodMonths.includes(t.month)),
    [allTrend, periodMonths]
  )

  const prevTrend = useMemo(
    () => compare ? allTrend.filter(t => prevPeriodMonths.includes(t.month)) : [],
    [allTrend, prevPeriodMonths, compare]
  )

  // ── Aggregated stats for summary cards ─────────────────────────────────────
  const currentStats = useMemo(() => aggregateTrend(currentTrend), [currentTrend])
  const prevStats = useMemo(
    () => prevTrend.length ? aggregateTrend(prevTrend) : null,
    [prevTrend]
  )

  const currentForCards = useMemo((): DashboardSummary | null => {
    if (!mainData) return null
    return {
      ...mainData,
      total_income: currentStats.totalIncome,
      total_spending: -currentStats.totalSpending,
      net_cash_flow: currentStats.net,
    }
  }, [mainData, currentStats])

  const prevForCards = useMemo((): DashboardSummary | null => {
    if (!prevStats) return null
    return {
      total_income: prevStats.totalIncome,
      total_spending: -prevStats.totalSpending,
      net_cash_flow: prevStats.net,
      transaction_count: 0,
      month: '',
      spending_by_category: [],
      monthly_trend: [],
      recent_transactions: [],
    }
  }, [prevStats])

  const categoryData = mainData?.spending_by_category ?? []

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">

        {/* Period dropdown */}
        <div className="w-44">
          <Select
            value={period}
            onChange={v => setPeriod(v as PeriodKey)}
            options={PERIODS.map(p => ({ value: p.key, label: p.label }))}
          />
        </div>

        {/* Compare toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
            Compare with previous period
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={compare}
            onClick={() => setCompare(c => !c)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 ${
              compare ? 'bg-accent-500' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                compare ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <SummaryCards
        current={currentForCards}
        previous={compare ? prevForCards : null}
        loading={loading}
      />

      {/* ── Row 1: Net Cash Flow (full width) ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Net Cash Flow</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-52 skeleton rounded-lg" />
          ) : (
            <NetCashFlowBar
              data={currentTrend}
              compareData={compare && prevTrend.length ? prevTrend : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Row 2: Spending by Category | Income ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingCategoryBar
              periodData={periodMonthlyData}
              loading={catLoading || loading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-52 skeleton rounded-lg" />
            ) : (
              <IncomeBar data={currentTrend} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Category Donut | Savings Rate ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[220px]">
            {loading ? (
              <div className="h-48 skeleton rounded-lg" />
            ) : (
              <CategoryDonut
                data={categoryData}
                total={currentStats.totalSpending}
              />
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Savings Rate</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[220px]">
            <SavingsRatePanel
              currentTrend={currentTrend}
              prevTrend={compare && prevTrend.length ? prevTrend : undefined}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
