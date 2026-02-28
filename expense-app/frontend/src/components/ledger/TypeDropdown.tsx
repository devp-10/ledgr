import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { TransactionType } from '../../types'

const OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'expense',  label: 'Expense' },
  { value: 'income',   label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
]

interface TypeDropdownProps {
  value: TransactionType
  onChange: (type: TransactionType) => void
  className?: string
}

export function TypeDropdown({ value, onChange, className }: TypeDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = OPTIONS.find(o => o.value === value) ?? OPTIONS[0]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'w-full flex items-center justify-between gap-1 text-xs px-1.5 py-0.5 rounded',
          'border border-border-light dark:border-border-dark',
          'bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'focus:outline-none focus:ring-1 focus:ring-accent-500 cursor-pointer',
          className,
        )}
      >
        <span>{selected.label}</span>
        <ChevronDown size={10} className="flex-shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 w-32 bg-surface dark:bg-[#171717] rounded-lg border border-border-light dark:border-border-dark shadow-soft overflow-hidden">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onMouseDown={() => { onChange(opt.value); setOpen(false) }}
              className={clsx(
                'w-full text-left text-xs px-3 py-1.5 transition-colors',
                opt.value === value
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
