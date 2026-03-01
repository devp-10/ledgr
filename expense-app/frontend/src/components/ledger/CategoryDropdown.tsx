import { useState, useRef, useEffect, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { getCategoryDotColor, getCategoryEmoji } from '../ui/Badge'

interface CategoryDropdownProps {
  value: string
  categories: string[]
  onChange: (cat: string) => void
  className?: string
}

/**
 * Custom searchable category picker — matches the aesthetic of the view-mode
 * category badge dropdown, for use in edit/review inline rows.
 * Uses a portal so it escapes overflow-hidden ancestor containers.
 */
export function CategoryDropdown({ value, categories, onChange, className }: CategoryDropdownProps) {
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
      const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow
      if (openUpward) {
        setPanelStyle({ position: 'fixed', bottom: window.innerHeight - r.top + 4, left: r.left, minWidth: r.width, zIndex: 9999 })
      } else {
        setPanelStyle({ position: 'fixed', top: r.bottom + 4, left: r.left, minWidth: r.width, zIndex: 9999 })
      }
    }
  }

  const doClose = () => { setOpen(false); setSearch('') }

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

  const filtered = search
    ? categories.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : categories

  const select = (cat: string) => { onChange(cat); doClose() }

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
        <span className="truncate">{value ? `${getCategoryEmoji(value)} ${value}` : 'Uncategorized'}</span>
        <ChevronDown size={10} className="flex-shrink-0 text-gray-400" />
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="w-52 bg-surface dark:bg-[#171717] rounded-lg border border-border-light dark:border-border-dark shadow-soft overflow-hidden"
        >
          <div className="p-2 border-b border-border-light dark:border-border-dark">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full text-xs px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            <button
              onMouseDown={() => select('')}
              className="w-full text-left text-xs px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-300 dark:bg-gray-600" />
              Uncategorized
            </button>
            {filtered.map(cat => (
              <button
                key={cat}
                onMouseDown={() => select(cat)}
                className="w-full text-left text-xs px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryDotColor(cat) }}
                />
                {getCategoryEmoji(cat)} {cat}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 px-3 py-2">No matches</p>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
