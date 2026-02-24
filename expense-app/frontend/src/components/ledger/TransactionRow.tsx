import { useState, useRef } from 'react'
import { Transaction } from '../../types'
import { getCategoryColor, getCategoryDotColor } from '../ui/Badge'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'

interface TransactionRowProps {
  transaction: Transaction
  categories: string[]
  selected: boolean
  onSelect: (id: number, checked: boolean) => void
  onCategoryChange: (id: number, category: string) => Promise<void>
}

function formatMoney(n: number) {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n >= 0 ? `+$${abs}` : `-$${abs}`
}

export function TransactionRow({ transaction: t, categories, selected, onSelect, onCategoryChange }: TransactionRowProps) {
  const [editingCat, setEditingCat] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCats = catSearch
    ? categories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()))
    : categories

  const handleCatSelect = async (cat: string) => {
    setSaving(true)
    setEditingCat(false)
    setCatSearch('')
    try {
      await onCategoryChange(t.id, cat)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-2.5 transition-colors border-b border-border-light dark:border-border-dark last:border-0',
      selected ? 'bg-accent-50 dark:bg-accent-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]',
    )}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={e => onSelect(t.id, e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 focus:ring-offset-0 cursor-pointer"
      />

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {(() => { try { return format(parseISO(t.date), 'MMM d, yyyy') } catch { return t.date } })()}
        </p>
      </div>

      {/* Category badge */}
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setEditingCat(e => !e)}
          disabled={saving}
          className={clsx(
            'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium transition-all',
            t.category ? getCategoryColor(t.category) : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
            'hover:opacity-90 cursor-pointer',
            saving && 'opacity-50'
          )}
        >
          {saving ? '…' : t.category ?? 'Uncategorized'}
        </button>

        {editingCat && (
          <div
            ref={dropdownRef}
            className="absolute top-full mt-1 right-0 z-20 w-52 bg-surface dark:bg-[#171717] rounded-lg border border-border-light dark:border-border-dark shadow-soft overflow-hidden"
          >
            <div className="p-2 border-b border-border-light dark:border-border-dark">
              <input
                autoFocus
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
                placeholder="Search..."
                className="w-full text-xs px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto py-1">
              {filteredCats.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCatSelect(cat)}
                  className="w-full text-left text-xs px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryDotColor(cat) }} />
                  {cat}
                </button>
              ))}
              {filteredCats.length === 0 && (
                <p className="text-xs text-gray-400 px-3 py-2">No matches</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Amount */}
      <span className={clsx(
        'font-money font-semibold text-sm flex-shrink-0 w-24 text-right',
        t.amount >= 0 ? 'text-status-positive' : 'text-gray-700 dark:text-gray-300'
      )}>
        {formatMoney(t.amount)}
      </span>
    </div>
  )
}
