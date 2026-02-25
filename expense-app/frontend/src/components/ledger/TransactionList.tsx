import { useState, ReactNode } from 'react'
import { Transaction, TransactionUpdate } from '../../types'
import { TransactionRow } from './TransactionRow'
import { EmptyState } from '../common/EmptyState'
import { Receipt, ChevronDown } from 'lucide-react'
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
  groupBy: string
  onSort: (col: string) => void
  onGroupBy: (g: string) => void
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

function groupTransactions(txns: Transaction[], groupBy: string): [string, Transaction[]][] {
  if (groupBy === 'date') {
    const groups = new Map<string, Transaction[]>()
    for (const t of txns) {
      if (!groups.has(t.date)) groups.set(t.date, [])
      groups.get(t.date)!.push(t)
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }
  if (groupBy === 'month') {
    const groups = new Map<string, Transaction[]>()
    for (const t of txns) {
      const key = t.date.substring(0, 7)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }
  if (groupBy === 'type') {
    const order = ['expense', 'income', 'transfer']
    const groups = new Map<string, Transaction[]>()
    for (const t of txns) {
      if (!groups.has(t.transaction_type)) groups.set(t.transaction_type, [])
      groups.get(t.transaction_type)!.push(t)
    }
    return [...groups.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
  }
  if (groupBy === 'account') {
    const groups = new Map<string, Transaction[]>()
    for (const t of txns) {
      const key = t.account_id ? String(t.account_id) : '__none__'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }
    return [...groups.entries()]
  }
  return [['all', txns]]
}

function groupLabel(key: string, groupBy: string, accounts: { id: number; name: string }[]): string {
  if (groupBy === 'date') {
    try { return format(parseISO(key), 'EEEE, MMMM d, yyyy') } catch { return key }
  }
  if (groupBy === 'month') {
    try { return format(parseISO(key + '-01'), 'MMMM yyyy') } catch { return key }
  }
  if (groupBy === 'type') return key.charAt(0).toUpperCase() + key.slice(1) + 's'
  if (groupBy === 'account') {
    if (key === '__none__') return 'No Account'
    const acct = accounts.find(a => String(a.id) === key)
    return acct ? acct.name : `Account ${key}`
  }
  return key
}

const GROUP_OPTIONS = [
  { id: 'date',    label: 'Date' },
  { id: 'month',   label: 'Month' },
  { id: 'type',    label: 'Type' },
  { id: 'account', label: 'Account' },
]

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
  loading, total, sortBy, sortDir, groupBy, onSort, onGroupBy
}: TransactionListProps) {
  const [showGroupMenu, setShowGroupMenu] = useState(false)

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

  const groups = groupTransactions(transactions, groupBy)
  const allSelected = transactions.length > 0 && transactions.every(t => selectedIds.has(t.id))

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

  return (
    <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden">

      {/* ── Column header ─────────────────────────────────────────────────── */}
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

        {/* Group-by picker lives where actions column is */}
        <div className="w-16 flex-shrink-0 flex justify-end relative">
          <button
            onClick={() => setShowGroupMenu(g => !g)}
            className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-0.5 transition-colors whitespace-nowrap"
          >
            {GROUP_OPTIONS.find(o => o.id === groupBy)?.label ?? 'Date'}
            <ChevronDown size={10} />
          </button>
          {showGroupMenu && (
            <div className="absolute right-0 top-full mt-1 z-20 w-32 bg-surface dark:bg-[#171717] rounded-lg border border-border-light dark:border-border-dark shadow-soft py-1">
              {GROUP_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { onGroupBy(opt.id); setShowGroupMenu(false) }}
                  className={clsx(
                    'w-full text-left text-xs px-3 py-1.5 transition-colors',
                    groupBy === opt.id
                      ? 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/10'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Count bar ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-1 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-800/30">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {selectedIds.size > 0
            ? `${selectedIds.size} selected of ${total.toLocaleString()}`
            : `${total.toLocaleString()} transaction${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Grouped rows ──────────────────────────────────────────────────── */}
      {groups.map(([key, txns]) => (
        <div key={key}>
          <div className="sticky top-14 z-10 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 border-b border-border-light dark:border-border-dark flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {groupLabel(key, groupBy, accounts)}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {txns.length} transaction{txns.length !== 1 ? 's' : ''}
            </span>
          </div>
          {txns.map(t => (
            <TransactionRow
              key={t.id}
              transaction={t}
              categories={categories}
              accounts={accounts}
              selected={selectedIds.has(t.id)}
              onSelect={onSelect}
              onPatch={onPatch}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
