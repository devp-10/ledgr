import { ReactNode, useEffect, useRef } from 'react'
import { Transaction, TransactionUpdate } from '../../types'
import { TransactionRow } from './TransactionRow'
import { EmptyState } from '../common/EmptyState'
import { Receipt, ChevronDown, Loader2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { clsx } from 'clsx'

interface TransactionListProps {
  transactions: Transaction[]
  categories: string[]
  accounts: { id: number; name: string }[]
  selectedIds: Set<number>
  onSelectAll: (checked: boolean) => void
  onSelect: (id: number, checked: boolean) => void
  onPatch: (id: number, update: Partial<TransactionUpdate>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  loading?: boolean
  total: number
  sortBy: string
  sortDir: string
  onSort: (col: string) => void
  hasMore?: boolean
  onLoadMore?: () => void
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border-light dark:border-border-dark">
      <div className="w-4 h-4 skeleton rounded" />
      <div className="w-[88px] h-3 skeleton" />
      <div className="flex-1 h-3.5 skeleton" />
      <div className="w-32 h-4 skeleton rounded" />
      <div className="w-24 h-3 skeleton hidden lg:block" />
      <div className="w-[84px] h-4 skeleton rounded" />
      <div className="w-24 h-3.5 skeleton" />
      <div className="w-16 h-4 skeleton" />
    </div>
  )
}

function groupByDate(txns: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>()
  for (const t of txns) {
    if (!groups.has(t.date)) groups.set(t.date, [])
    groups.get(t.date)!.push(t)
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

function dateGroupLabel(key: string): string {
  try { return format(parseISO(key), 'EEEE, MMMM d, yyyy') } catch { return key }
}

// Column widths — must match TransactionRow exactly
const COL = {
  checkbox:    'w-4 flex-shrink-0',
  date:        'w-[88px] flex-shrink-0',
  description: 'flex-1 min-w-0',
  category:    'w-32 flex-shrink-0',
  notes:       'w-24 flex-shrink-0 hidden lg:block',
  type:        'w-[84px] flex-shrink-0',
  amount:      'w-24 flex-shrink-0 text-right',
  actions:     'w-16 flex-shrink-0',
}

export function TransactionList({
  transactions, categories, accounts, selectedIds, onSelectAll, onSelect, onPatch, onDelete,
  loading, total, sortBy, sortDir, onSort, hasMore, onLoadMore,
}: TransactionListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !onLoadMore || !hasMore) return
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMore()
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [onLoadMore, hasMore])

  if (loading && !transactions.length) {
    return (
      <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden">
        {[1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <EmptyState
        icon={<Receipt size={24} />}
        title="No transactions found"
        description="Try adjusting your filters or import a statement to get started."
      />
    )
  }

  const allSelected = transactions.length > 0 && transactions.every(t => selectedIds.has(t.id))
  const groupedByDate = sortBy === 'date'

  const SortBtn = ({ col, children }: { col: string; children: ReactNode }) => (
    <button
      onClick={() => onSort(col)}
      className={clsx(
        'inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
        sortBy === col
          ? 'text-accent-600 dark:text-accent-400'
          : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
      )}
    >
      {children}
      {sortBy === col && <ChevronDown size={10} className={sortDir === 'asc' ? 'rotate-180' : ''} />}
    </button>
  )

  const ColLabel = ({ children }: { children: ReactNode }) => (
    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
      {children}
    </span>
  )

  const rowProps = (t: Transaction) => ({
    key: t.id,
    transaction: t,
    categories,
    accounts,
    selected: selectedIds.has(t.id),
    onSelect,
    onPatch,
    onDelete,
  })

  return (
    <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden">

      {/* ── Column header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
        <div className={COL.checkbox}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={e => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 focus:ring-offset-0 cursor-pointer"
          />
        </div>
        <div className={COL.date}>        <SortBtn col="date">Date</SortBtn></div>
        <div className={COL.description}> <ColLabel>Description</ColLabel></div>
        <div className={COL.category}>    <SortBtn col="category">Category</SortBtn></div>
        <div className={COL.notes}>       <ColLabel>Notes</ColLabel></div>
        <div className={COL.type}>        <SortBtn col="transaction_type">Type</SortBtn></div>
        <div className={COL.amount}>      <SortBtn col="amount">Amount</SortBtn></div>
        <div className={COL.actions} />
      </div>

      {/* ── Count bar ──────────────────────────────────────────────────── */}
      <div className="px-4 py-1 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {selectedIds.size > 0
            ? `${selectedIds.size} selected of ${total.toLocaleString()}`
            : `${total.toLocaleString()} transaction${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Rows ──────────────────────────────────────────────────────── */}
      {groupedByDate ? (
        // Date-sorted: show sticky date group headers
        groupByDate(transactions).map(([key, txns]) => (
          <div key={key}>
            <div className="sticky top-14 z-10 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 border-b border-border-light dark:border-border-dark flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {dateGroupLabel(key)}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {txns.length} transaction{txns.length !== 1 ? 's' : ''}
              </span>
            </div>
            {txns.map(t => <TransactionRow {...rowProps(t)} />)}
          </div>
        ))
      ) : (
        // Other sort: flat list, no group headers
        transactions.map(t => <TransactionRow {...rowProps(t)} />)
      )}

      {/* ── Infinite scroll sentinel ───────────────────────────────────── */}
      <div ref={sentinelRef} />
      {loading && transactions.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400 dark:text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          Loading more…
        </div>
      )}
    </div>
  )
}
