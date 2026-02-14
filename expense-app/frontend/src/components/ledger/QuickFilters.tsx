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
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
      {FILTERS.map(f => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={clsx(
            'flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-150',
            active === f.id
              ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
