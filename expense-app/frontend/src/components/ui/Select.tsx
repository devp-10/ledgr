import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

export interface SelectOption {
  value: string
  label: string
  /** Optional emoji/icon prefix rendered before the label */
  prefix?: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** Shown in the trigger when value matches no option */
  placeholder?: string
  /** Show a search field inside the dropdown */
  searchable?: boolean
  /** Extra classes applied to the trigger button */
  className?: string
  disabled?: boolean
  /** Open the dropdown immediately on mount (click-to-edit pattern) */
  initiallyOpen?: boolean
  /** Called when the dropdown closes without a selection */
  onClose?: () => void
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable,
  className,
  disabled,
  initiallyOpen,
  onClose,
}: SelectProps) {
  const [open, setOpen] = useState(!!initiallyOpen)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const filtered = searchable && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selected = options.find(o => o.value === value)
  const hasValue = !!selected

  const close = () => { setOpen(false); setSearch('') }

  const pick = (v: string) => {
    onChange(v)
    close()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        disabled={disabled}
        className={clsx(
          'w-full flex items-center justify-between gap-2 text-left',
          'rounded-md border border-border-light dark:border-border-dark',
          'bg-surface dark:bg-gray-800',
          'text-sm px-3 py-2',
          'focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500',
          'transition-colors cursor-pointer select-none',
          hasValue ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <span className="truncate flex-1">
          {selected ? (
            <>
              {selected.prefix && <span className="mr-1.5">{selected.prefix}</span>}
              {selected.label}
            </>
          ) : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={clsx('flex-shrink-0 text-gray-400 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-full w-max max-w-xs bg-surface dark:bg-[#171717] rounded-lg border border-border-light dark:border-border-dark shadow-soft overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-border-light dark:border-border-dark">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full text-sm px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={() => pick(opt.value)}
                className={clsx(
                  'w-full text-left text-sm px-3 py-1.5 transition-colors',
                  opt.value === value
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                )}
              >
                {opt.prefix && <span className="mr-1.5">{opt.prefix}</span>}
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 px-3 py-2">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
