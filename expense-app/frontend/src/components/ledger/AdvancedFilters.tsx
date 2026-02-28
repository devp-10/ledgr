import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { TransactionFilters, Account } from '../../types'
import { Select } from '../ui/Select'

interface AdvancedFiltersProps {
  filters: TransactionFilters
  categories: string[]
  accounts: Account[]
  onUpdate: (changes: Partial<TransactionFilters>) => void
}

export function AdvancedFilters({ filters, categories, accounts, onUpdate }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false)

  const hasActive = !!(filters.category || filters.transaction_type || filters.date_from || filters.date_to || filters.amount_min || filters.amount_max || filters.account_id)
  const clearAll = () => onUpdate({ category: undefined, transaction_type: undefined, date_from: undefined, date_to: undefined, amount_min: undefined, amount_max: undefined, account_id: undefined })

  const inputCls = 'w-full rounded-md border border-border-light dark:border-border-dark bg-surface dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500'
  const labelCls = 'text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block'

  const accountOptions = [
    { value: '', label: 'All accounts' },
    ...accounts.map(a => ({ value: String(a.id), label: a.name })),
  ]

  const typeOptions = [
    { value: '', label: 'All types' },
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
    { value: 'transfer', label: 'Transfer' },
  ]

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.map(c => ({ value: c, label: c })),
  ]

  return (
    <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Filters</span>
          {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />}
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="border-t border-border-light dark:border-border-dark p-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className={labelCls}>Account</label>
              <Select
                value={String(filters.account_id ?? '')}
                onChange={v => onUpdate({ account_id: v ? Number(v) : undefined })}
                options={accountOptions}
              />
            </div>

            <div>
              <label className={labelCls}>Type</label>
              <Select
                value={filters.transaction_type ?? ''}
                onChange={v => onUpdate({ transaction_type: v || undefined })}
                options={typeOptions}
              />
            </div>

            <div>
              <label className={labelCls}>Category</label>
              <Select
                value={filters.category ?? ''}
                onChange={v => onUpdate({ category: v || undefined })}
                options={categoryOptions}
                searchable
              />
            </div>

            <div>
              <label className={labelCls}>From</label>
              <input type="date" value={filters.date_from ?? ''} onChange={e => onUpdate({ date_from: e.target.value || undefined })} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>To</label>
              <input type="date" value={filters.date_to ?? ''} onChange={e => onUpdate({ date_to: e.target.value || undefined })} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Amount</label>
              <div className="flex items-center gap-1.5">
                <input type="number" placeholder="Min" value={filters.amount_min ?? ''} onChange={e => onUpdate({ amount_min: e.target.value || undefined })} className={inputCls + ' px-2'} />
                <span className="text-gray-400 text-xs">–</span>
                <input type="number" placeholder="Max" value={filters.amount_max ?? ''} onChange={e => onUpdate({ amount_max: e.target.value || undefined })} className={inputCls + ' px-2'} />
              </div>
            </div>
          </div>

          {hasActive && (
            <button onClick={clearAll} className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-status-negative transition-colors">
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
