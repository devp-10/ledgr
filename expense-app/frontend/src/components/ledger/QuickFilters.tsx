import { clsx } from 'clsx'
import { QuickFilter } from '../../types'

const FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'this-month', label: 'This Month' },
  { id: 'last-30', label: 'Last 30 Days' },
  { id: 'last-90', label: 'Last 90 Days' },
  { id: 'this-year', label: 'This Year' },
  { id: 'all-time', label: 'All Time' },
]

interface QuickFiltersProps {
  active: QuickFilter
  onChange: (f: QuickFilter) => void
}

export function QuickFilters({ active, onChange }: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
      {FILTERS.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={clsx(
            'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150',
            active === f.id
              ? 'tab-pill-active'
              : 'text-white/40 hover:text-white/70 hover:bg-white/05 border border-transparent'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
