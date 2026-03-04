import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'

interface MonthPickerProps {
  value: string // "YYYY-MM"
  onChange: (month: string) => void
  maxDate?: string
}

export function MonthPicker({ value, onChange, maxDate }: MonthPickerProps) {
  const date = parseISO(`${value}-01`)
  const maxD = maxDate ? parseISO(`${maxDate}-01`) : new Date()

  const prev = () => onChange(format(subMonths(date, 1), 'yyyy-MM'))
  const next = () => {
    const nextDate = addMonths(date, 1)
    if (nextDate <= maxD) onChange(format(nextDate, 'yyyy-MM'))
  }
  const isAtMax = addMonths(date, 1) > maxD

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={prev}
        className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[120px] text-center">
        {format(date, 'MMMM yyyy')}
      </span>
      <button
        onClick={next}
        disabled={isAtMax}
        className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
