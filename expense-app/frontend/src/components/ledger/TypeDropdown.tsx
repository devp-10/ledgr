import { useState, useRef, useEffect, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
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
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom - 8
      const spaceAbove = r.top - 8
      const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow
      if (openUpward) {
        setPanelStyle({ position: 'fixed', bottom: window.innerHeight - r.top + 4, left: r.left, minWidth: r.width, zIndex: 9999 })
      } else {
        setPanelStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, minWidth: r.width, zIndex: 9999 })
      }
    }
  }

  const doClose = () => setOpen(false)

  // Outside click
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

  // Close on scroll / resize (but not when scrolling inside the panel)
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

  const selected = OPTIONS.find(o => o.value === value) ?? OPTIONS[0]

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => open ? doClose() : (updatePosition(), setOpen(true))}
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

      {open && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="w-32 bg-surface dark:bg-[#171717] rounded-lg border border-border-light dark:border-border-dark shadow-soft overflow-hidden"
        >
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              onMouseDown={() => { onChange(opt.value); doClose() }}
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
        </div>,
        document.body,
      )}
    </div>
  )
}
