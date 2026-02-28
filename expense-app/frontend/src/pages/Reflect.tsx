import { useState, useEffect, useMemo } from 'react'
import { format, subMonths, startOfYear } from 'date-fns'
import { ChevronDown } from 'lucide-react'
import { api } from '../lib/api'
import type { DashboardSummary, MonthTrend } from '../lib/api'
import { SummaryCards } from '../components/reflect/SummaryCards'
import { SavingsRatePanel } from '../components/reflect/SavingsRatePanel'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { SpendingIncomeBar } from '../components/charts/SpendingIncomeBar'
import { TrendLine } from '../components/charts/TrendLine'
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

/** Deduplicate + sort a combined trend array by month */
function mergeTrends(a: MonthTrend[], b: MonthTrend[]): MonthTrend[] {
  const map = new Map<string, MonthTrend>()
  ;[...a, ...b].forEach(t => map.set(t.month, t))
  return [...map.values()].sort((x, y) => x.month.localeCompare(y.month))
}

function slicePeriod(trend: MonthTrend[], period: PeriodKey, now: Date): MonthTrend[] {
  if (!trend.length) return []
  switch (period) {
    case 'this_year': {
      const year = format(now, 'yyyy')
      return trend.filter(t => t.month.startsWith(year))
    }
    case 'last_month':
      return trend.slice(-1)
    case 'last_3_months':
      return trend.slice(-3)
    case 'last_6_months':
      return trend.slice(-6)
  }
}

function slicePrevPeriod(trend: MonthTrend[], period: PeriodKey, now: Date): MonthTrend[] {
  if (!trend.length) return []
  switch (period) {
    case 'this_year': {
      const prevYear = format(subMonths(startOfYear(now), 1), 'yyyy')
      return trend.filter(t => t.month.startsWith(prevYear))
    }
    case 'last_month':
      return trend.slice(-2, -1)
    case 'last_3_months':
      // Need 6 months of trend to compute comparison
      return trend.length >= 6 ? trend.slice(-6, -3) : []
    case 'last_6_months':
      // Need 12 months of trend to compute comparison
      return trend.length >= 12 ? trend.slice(-12, -6) : []
  }
}

function aggregateTrend(trend: MonthTrend[]) {
  const totalIncome = trend.reduce((s, t) => s + t.income, 0)
  const totalSpending = trend.reduce((s, t) => s + Math.abs(t.spending), 0)
  return { totalIncome, totalSpending, net: totalIncome - totalSpending }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Reflect() {
  const addToast = useToastContext()
  const [period, setPeriod] = useState<PeriodKey>('last_month')
  const [compare, setCompare] = useState(false)
  const [mainData, setMainData] = useState<DashboardSummary | null>(null)
  const [allTrend, setAllTrend] = useState<MonthTrend[]>([])
  const [loading, setLoading] = useState(true)

  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    setLoading(true)
    // Fetch current + 6-months-ago dashboard in parallel to get ~12 months of trend
    const sixMonthsAgo = format(subMonths(now, 6), 'yyyy-MM')
    Promise.all([
      api.getDashboard(),
      api.getDashboard(sixMonthsAgo),
    ])
      .then(([curr, old]) => {
        setMainData(curr)
        setAllTrend(mergeTrends(old.monthly_trend, curr.monthly_trend))
      })
      .catch(() => addToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  // Period-sliced trend data
  const currentTrend = useMemo(() => slicePeriod(allTrend, period, now), [allTrend, period, now])
  const prevTrend = useMemo(
    () => compare ? slicePrevPeriod(allTrend, period, now) : [],
    [allTrend, period, compare, now]
  )

  // Aggregated stats for summary cards
  const currentStats = useMemo(() => aggregateTrend(currentTrend), [currentTrend])
  const prevStats = useMemo(
    () => prevTrend.length ? aggregateTrend(prevTrend) : null,
    [prevTrend]
  )

  // Synthetic DashboardSummary objects for SummaryCards (only uses income/spending/net)
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
  const categoryTotal = currentStats.totalSpending

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">

        {/* Period dropdown */}
        <div className="relative">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as PeriodKey)}
            className="appearance-none pl-3.5 pr-8 py-2 text-sm font-medium rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] text-gray-700 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/30 transition-shadow"
          >
            {PERIODS.map(p => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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
      <SummaryCards current={currentForCards} previous={compare ? prevForCards : null} loading={loading} />

      {/* ── Row 1: Income & Spending bar (full width) ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Income &amp; Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingIncomeBar data={currentTrend} />
        </CardContent>
      </Card>

      {/* ── Row 2: Spending trend | Income trend ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 skeleton rounded-lg" />
            ) : (
              <TrendLine
                data={currentTrend}
                compareData={compare && prevTrend.length ? prevTrend : undefined}
                mode="spending"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 skeleton rounded-lg" />
            ) : (
              <TrendLine
                data={currentTrend}
                compareData={compare && prevTrend.length ? prevTrend : undefined}
                mode="income"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Category donut | Savings rate ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-48 skeleton rounded-lg" />
            ) : (
              <CategoryDonut data={categoryData} total={categoryTotal} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
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
