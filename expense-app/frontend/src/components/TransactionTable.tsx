import { useState } from 'react'
import clsx from 'clsx'
import { Transaction } from '../lib/api'
import { CategoryBadge } from './CategoryBadge'

interface Props {
  transactions: Transaction[]
  categories: string[]
  onCategoryChange: (id: number, category: string) => Promise<void>
  sortBy: string
  sortDir: string
  onSort: (col: string) => void
  selectedIds: Set<number>
  onSelectAll: (checked: boolean) => void
  onSelectOne: (id: number, checked: boolean) => void
}

const SORTABLE_COLS = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount' },
  { key: 'category', label: 'Category' },
]

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatAmount(amount: number) {
  return (amount < 0 ? '-' : '+') + '$' + Math.abs(amount).toFixed(2)
}

interface EditableCategoryProps {
  transaction: Transaction
  categories: string[]
  onCategoryChange: (id: number, category: string) => Promise<void>
}

function EditableCategory({ transaction, categories, onCategoryChange }: EditableCategoryProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value
    setSaving(true)
    try {
      await onCategoryChange(transaction.id, newCat)
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <select
        autoFocus
        defaultValue={transaction.category || ''}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        disabled={saving}
        className="text-xs border border-blue-300 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 dark:border-blue-600 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Uncategorized</option>
        {categories.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Click to edit category"
      className="hover:opacity-80 transition-opacity"
    >
      <CategoryBadge category={transaction.category} />
    </button>
  )
}

export function TransactionTable({
  transactions,
  categories,
  onCategoryChange,
  sortBy,
  sortDir,
  onSort,
  selectedIds,
  onSelectAll,
  onSelectOne,
}: Props) {
  const allSelected = transactions.length > 0 && transactions.every(t => selectedIds.has(t.id))
  const someSelected = transactions.some(t => selectedIds.has(t.id)) && !allSelected

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <span className="text-gray-300 dark:text-gray-600 ml-1">↕</span>
    return <span className="text-blue-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => { if (el) el.indeterminate = someSelected }}
                onChange={e => onSelectAll(e.target.checked)}
                className="rounded"
              />
            </th>
            {SORTABLE_COLS.map(col => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 select-none whitespace-nowrap"
              >
                {col.label}
                <SortIcon col={col.key} />
              </th>
            ))}
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                No transactions found
              </td>
            </tr>
          ) : (
            transactions.map(t => (
              <tr
                key={t.id}
                className={clsx(
                  'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                  selectedIds.has(t.id) && 'bg-blue-50 dark:bg-blue-900/20',
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(t.id)}
                    onChange={e => onSelectOne(t.id, e.target.checked)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                  {formatDate(t.date)}
                </td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100 max-w-xs">
                  <span className="truncate block" title={t.description}>{t.description}</span>
                </td>
                <td className={clsx(
                  'px-4 py-3 whitespace-nowrap font-medium tabular-nums',
                  t.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400',
                )}>
                  {formatAmount(t.amount)}
                </td>
                <td className="px-4 py-3">
                  <EditableCategory
                    transaction={t}
                    categories={categories}
                    onCategoryChange={onCategoryChange}
                  />
                </td>
                <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs max-w-xs">
                  <span className="truncate block" title={t.source_file || ''}>{t.source_file || '—'}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
