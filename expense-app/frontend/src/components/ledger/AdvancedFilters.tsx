import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { TransactionFilters } from '../../types'

interface AdvancedFiltersProps {
  filters: TransactionFilters
  categories: string[]
  onUpdate: (changes: Partial<TransactionFilters>) => void
}

const inputCls = 'input-dark w-full text-sm px-3 py-2'
const labelCls = 'text-xs font-medium text-white/30 mb-1 block'

export function AdvancedFilters({ filters, categories, onUpdate }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false)

  const hasActive = !!(filters.category || filters.date_from || filters.date_to || filters.amount_min || filters.amount_max)
  const clearAll = () => onUpdate({ category: undefined, date_from: undefined, date_to: undefined, amount_min: undefined, amount_max: undefined })

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-white/40 hover:text-white/70 hover:bg-white/03 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Filters</span>
          {hasActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="border-t border-white/06 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select
                value={filters.category ?? ''}
                onChange={e => onUpdate({ category: e.target.value || undefined })}
                className={inputCls}
              >
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>From</label>
              <input
                type="date"
                value={filters.date_from ?? ''}
                onChange={e => onUpdate({ date_from: e.target.value || undefined })}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>To</label>
              <input
                type="date"
                value={filters.date_to ?? ''}
                onChange={e => onUpdate({ date_to: e.target.value || undefined })}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Amount</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.amount_min ?? ''}
                  onChange={e => onUpdate({ amount_min: e.target.value || undefined })}
                  className="input-dark w-full text-sm px-2 py-2"
                />
                <span className="text-white/20 text-xs">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.amount_max ?? ''}
                  onChange={e => onUpdate({ amount_max: e.target.value || undefined })}
                  className="input-dark w-full text-sm px-2 py-2"
                />
              </div>
            </div>
          </div>

          {hasActive && (
            <button
              onClick={clearAll}
              className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
