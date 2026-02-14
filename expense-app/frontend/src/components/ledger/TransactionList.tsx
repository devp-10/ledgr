import { Transaction } from '../../types'
import { TransactionRow } from './TransactionRow'
import { EmptyState } from '../common/EmptyState'
import { Receipt } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface TransactionListProps {
  transactions: Transaction[]
  categories: string[]
  selectedIds: Set<number>
  onSelectAll: (checked: boolean) => void
  onSelect: (id: number, checked: boolean) => void
  onCategoryChange: (id: number, category: string) => Promise<void>
  loading?: boolean
  total: number
}

function groupByDate(txns: Transaction[]) {
  const groups = new Map<string, Transaction[]>()
  for (const t of txns) {
    const key = t.date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }
  return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="w-4 h-4 skeleton" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 skeleton w-3/5" />
        <div className="h-2.5 skeleton w-2/5" />
      </div>
      <div className="w-20 h-5 skeleton" />
      <div className="w-16 h-4 skeleton" />
    </div>
  )
}

export function TransactionList({
  transactions, categories, selectedIds, onSelectAll, onSelect, onCategoryChange, loading, total
}: TransactionListProps) {
  if (loading && !transactions.length) {
    return (
      <div className="glass rounded-2xl overflow-hidden">
        {[1,2,3,4,5,6,7,8].map(i => <SkeletonRow key={i} />)}
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

  const groups = groupByDate(transactions)
  const allSelected = transactions.every(t => selectedIds.has(t.id))

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Select all header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/06">
        <input
          type="checkbox"
          checked={allSelected && transactions.length > 0}
          onChange={e => onSelectAll(e.target.checked)}
          className="w-4 h-4 rounded border-white/20 bg-white/05 text-primary-500 focus:ring-primary-500/30 focus:ring-offset-0 cursor-pointer"
        />
        <span className="text-xs text-white/30">
          {selectedIds.size > 0
            ? `${selectedIds.size} selected of ${total}`
            : `${total.toLocaleString()} transaction${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Grouped rows */}
      {groups.map(([date, txns]) => (
        <div key={date}>
          <div className="sticky top-[112px] z-10 glass px-4 py-1.5 border-b border-white/04">
            <span className="text-xs font-semibold text-white/30">
              {(() => { try { return format(parseISO(date), 'EEEE, MMMM d, yyyy') } catch { return date } })()}
            </span>
          </div>
          {txns.map(t => (
            <TransactionRow
              key={t.id}
              transaction={t}
              categories={categories}
              selected={selectedIds.has(t.id)}
              onSelect={onSelect}
              onCategoryChange={onCategoryChange}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
