import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { api, MonthlyReport, Transaction } from '../lib/api'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`
}

function nextMonth(m: string) {
  const current = today()
  const [y, mo] = m.split('-').map(Number)
  const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
  return next > current ? m : next
}

function getMonthLabel(m: string) {
  const [year, month] = m.split('-')
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })
}

function PctChange({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-gray-400 text-xs">—</span>
  const up = pct > 0
  return (
    <span className={`text-xs font-medium ${up ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export function Reports() {
  const [month, setMonth] = useState(today())
  const [data, setData] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getReport(month)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [month])

  const isCurrentMonth = month === today()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Report</h1>
        <div className="flex items-center gap-2 no-print">
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
          </div>
          <button
            onClick={() => window.print()}
            className="ml-4 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Print
          </button>
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
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Spending</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${data.total_spending.toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Income</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ${data.total_income.toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Categories</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.category_breakdown.length}
              </div>
            </div>
          </div>

          {/* Category breakdown table + bar chart */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Category Breakdown</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Category</th>
                    <th className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">Amount</th>
                    <th className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">% Total</th>
                    <th className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">vs Prior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.category_breakdown.map(row => (
                    <tr key={row.category} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{row.category}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">
                        ${row.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">
                        {row.pct_of_total.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <PctChange pct={row.pct_change} />
                      </td>
                    </tr>
                  ))}
                  {data.category_breakdown.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                        No spending data for this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Spending by Category</h2>
              {data.category_breakdown.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                  No data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    layout="vertical"
                    data={data.category_breakdown.slice(0, 10)}
                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top 10 expenses */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Top 10 Largest Expenses</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">#</th>
                  <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Date</th>
                  <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Description</th>
                  <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Category</th>
                  <th className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.top_expenses.map((t, i) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2.5 text-gray-400 dark:text-gray-500">{i + 1}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 max-w-xs">
                      <span className="truncate block">{t.description}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{t.category || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-600 dark:text-red-400 tabular-nums">
                      ${Math.abs(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {data.top_expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      No expenses for this month
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
