import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, DashboardSummary, Transaction } from '../lib/api'
import { CategoryDonut } from '../components/charts/CategoryDonut'
import { MonthlyTrendLine } from '../components/charts/MonthlyTrendLine'
import { CategoryBadge } from '../components/CategoryBadge'

function getMonthLabel(m: string) {
  const [year, month] = m.split('-')
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })
}

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`
}

function nextMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
  return next > currentMonth ? m : next
}

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatAmount(amount: number) {
  return '$' + Math.abs(amount).toFixed(2)
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}

interface SummaryCardProps {
  label: string
  value: string
  sub?: string
  color?: string
}

function SummaryCard({ label, value, sub, color = 'text-gray-900 dark:text-gray-100' }: SummaryCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

function RecentRow({ t }: { t: Transaction }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 dark:text-gray-100 truncate">{t.description}</div>
        <div className="text-xs text-gray-400 dark:text-gray-500">{formatDate(t.date)}</div>
      </div>
      <CategoryBadge category={t.category} />
      <div className={`text-sm font-medium tabular-nums whitespace-nowrap ${
        t.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
      }`}>
        {(t.amount < 0 ? '-' : '+') + '$' + Math.abs(t.amount).toFixed(2)}
      </div>
    </div>
  )
}

export function Dashboard() {
  const [month, setMonth] = useState(today())
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getDashboard(month)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [month])

  const currentMonth = today()
  const isCurrentMonth = month === currentMonth

  return (
    <div className="space-y-6">
      {/* Header + month selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(prevMonth(month))}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-36 text-center">
            {getMonthLabel(month)}
          </span>
          <button
            onClick={() => setMonth(nextMonth(month))}
            disabled={isCurrentMonth}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ›
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setMonth(currentMonth)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-1"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4">
            <SummaryCard
              label="Total Spending"
              value={`$${data.total_spending.toFixed(2)}`}
              color="text-red-600 dark:text-red-400"
            />
            <SummaryCard
              label="Total Income"
              value={`$${data.total_income.toFixed(2)}`}
              color="text-emerald-600 dark:text-emerald-400"
            />
            <SummaryCard
              label="Net Cash Flow"
              value={(data.net_cash_flow >= 0 ? '+$' : '-$') + Math.abs(data.net_cash_flow).toFixed(2)}
              color={data.net_cash_flow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
            />
            <SummaryCard
              label="Transactions"
              value={String(data.transaction_count)}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending by Category</h2>
              <CategoryDonut data={data.spending_by_category} total={data.total_spending} />
            </div>
            <div className="col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Trend (Last 6 Months)</h2>
              <MonthlyTrendLine data={data.monthly_trend} />
            </div>
          </div>

          {/* Recent transactions */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Transactions</h2>
              <Link
                to="/transactions"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all →
              </Link>
            </div>
            {data.recent_transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                No transactions yet.{' '}
                <Link to="/upload" className="text-blue-600 dark:text-blue-400 hover:underline">Upload a statement</Link>
              </div>
            ) : (
              data.recent_transactions.map(t => <RecentRow key={t.id} t={t} />)
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
