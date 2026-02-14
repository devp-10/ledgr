import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { TransactionFilters } from '../../types'

interface AdvancedFiltersProps {
  filters: TransactionFilters
  categories: string[]
  onUpdate: (changes: Partial<TransactionFilters>) => void
}

export function AdvancedFilters({ filters, categories, onUpdate }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false)

  const hasActive = !!(filters.category || filters.date_from || filters.date_to || filters.amount_min || filters.amount_max)

  const clearAll = () => onUpdate({ category: undefined, date_from: undefined, date_to: undefined, amount_min: undefined, amount_max: undefined })

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Filters</span>
          {hasActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          )}
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Category */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
              <select
                value={filters.category ?? ''}
                onChange={e => onUpdate({ category: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">From</label>
              <input
                type="date"
                value={filters.date_from ?? ''}
                onChange={e => onUpdate({ date_from: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">To</label>
              <input
                type="date"
                value={filters.date_to ?? ''}
                onChange={e => onUpdate({ date_to: e.target.value || undefined })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>

            {/* Amount range */}
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Amount</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.amount_min ?? ''}
                  onChange={e => onUpdate({ amount_min: e.target.value || undefined })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.amount_max ?? ''}
                  onChange={e => onUpdate({ amount_max: e.target.value || undefined })}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {hasActive && (
            <button
              onClick={clearAll}
              className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-danger-500 transition-colors"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
