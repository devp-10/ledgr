import { useState, useRef, useEffect, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom - 8
      const spaceAbove = r.top - 8
      const openUpward = spaceBelow < 260 && spaceAbove > spaceBelow
      if (openUpward) {
        setPanelStyle({ position: 'fixed', bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width, zIndex: 9999 })
      } else {
        setPanelStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, width: r.width, zIndex: 9999 })
      }
    }
  }

  const doClose = (callOnClose = true) => {
    setOpen(false)
    setSearch('')
    if (callOnClose) onClose?.()
  }

  // Open on mount when initiallyOpen
  useEffect(() => {
    if (initiallyOpen) { updatePosition(); setOpen(true) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return
      doClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Close on scroll / resize so panel doesn't drift (but not when scrolling inside the panel)
  useEffect(() => {
    if (!open) return
    const handler = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return
      doClose()
    }
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filtered = searchable && search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const selected = options.find(o => o.value === value)
  const hasValue = !!selected

  const pick = (v: string) => { onChange(v); doClose(false) }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (disabled) return; open ? doClose() : (updatePosition(), setOpen(true)) }}
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

      {open && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="w-max max-w-xs bg-surface dark:bg-[#171717] rounded-lg border border-border-light dark:border-border-dark shadow-soft overflow-hidden"
        >
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
        </div>,
        document.body,
      )}
    </div>
  )
}
