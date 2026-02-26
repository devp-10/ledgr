import { useState } from 'react'
import { Transaction, TransactionType, TransactionUpdate } from '../../types'
import { EmptyState } from '../common/EmptyState'
import { CheckSquare, Check, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { CategoryDropdown } from './CategoryDropdown'

interface ToReviewListProps {
  transactions: Transaction[]
  categories: string[]
  accounts: { id: number; name: string }[]
  selectedIds: Set<number>
  onSelectAll: (checked: boolean) => void
  onSelect: (id: number, checked: boolean) => void
  onReview: (id: number, update: Partial<TransactionUpdate>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  loading?: boolean
}

// Column widths — must match TransactionRow edit mode exactly
const COL = {
  checkbox:    'w-4 flex-shrink-0',
  date:        'w-[88px] flex-shrink-0',
  description: 'flex-1 min-w-0',
  category:    'w-32 flex-shrink-0',
  notes:       'w-24 flex-shrink-0 hidden lg:block',
  type:        'w-[84px] flex-shrink-0',
  amount:      'w-24 flex-shrink-0',
  actions:     'w-16 flex-shrink-0',
}

const inputCls = 'w-full text-sm px-1.5 py-0.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500'

function ReviewRow({
  transaction: t,
  categories,
  selected,
  onSelect,
  onReview,
  onDelete,
}: {
  transaction: Transaction
  categories: string[]
  selected: boolean
  onSelect: (id: number, checked: boolean) => void
  onReview: (id: number, update: Partial<TransactionUpdate>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [type, setType]       = useState<TransactionType>(t.transaction_type)
  const [desc, setDesc]       = useState(t.description)
  const [date, setDate]       = useState(t.date)
  const [amount, setAmount]   = useState(String(Math.abs(t.amount)))
  const [category, setCat]    = useState(t.category ?? '')
  const [notes, setNotes]     = useState(t.notes ?? '')
  const [saving, setSaving]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleReview = async () => {
    setSaving(true)
    try {
      const raw = parseFloat(amount) || 0
      const signed = type === 'expense' ? -Math.abs(raw) : Math.abs(raw)
      await onReview(t.id, {
        description: desc,
        date,
        amount: signed,
        transaction_type: type,
        category: type === 'expense' ? (category || null) : null,
        notes,
        reviewed: true,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(t.id) }
    finally { setDeleting(false) }
  }

  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-1.5 border-b border-border-light dark:border-border-dark last:border-0',
      selected ? 'bg-accent-50/60 dark:bg-accent-900/15' : 'bg-amber-50/30 dark:bg-amber-900/5',
    )}>
      {/* Checkbox */}
      <div className={COL.checkbox}>
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(t.id, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 cursor-pointer"
        />
      </div>

      {/* Date */}
      <div className={COL.date}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
      </div>

      {/* Description */}
      <div className={COL.description}>
        <input value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} />
      </div>

      {/* Category — expense only */}
      <div className={COL.category}>
        {type === 'expense' && (
          <CategoryDropdown
            value={category}
            categories={categories}
            onChange={setCat}
          />
        )}
      </div>

      {/* Notes */}
      <div className={COL.notes}>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes..."
          className={clsx(inputCls, 'text-xs')}
        />
      </div>

      {/* Type */}
      <div className={COL.type}>
        <select
          value={type}
          onChange={e => setType(e.target.value as TransactionType)}
          className={clsx(inputCls, 'text-xs capitalize')}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
      </div>

      {/* Amount */}
      <div className={COL.amount}>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className={clsx(inputCls, 'text-right')}
        />
      </div>

      {/* Actions: confirm review + delete */}
      <div className={clsx('flex items-center gap-1 justify-end', COL.actions)}>
        {confirmDel ? (
          <>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Confirm delete"
              className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-[10px] font-semibold disabled:opacity-50"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              title="Cancel"
              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-[10px] font-semibold"
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleReview}
              disabled={saving}
              title="Mark as Reviewed"
              className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => setConfirmDel(true)}
              title="Delete"
              className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border-light dark:border-border-dark">
      <div className="w-4 h-4 skeleton rounded" />
      <div className="w-[88px] h-6 skeleton rounded" />
      <div className="flex-1 h-6 skeleton rounded" />
      <div className="w-32 h-6 skeleton rounded" />
      <div className="w-24 h-6 skeleton rounded hidden lg:block" />
      <div className="w-[84px] h-6 skeleton rounded" />
      <div className="w-24 h-6 skeleton rounded" />
      <div className="w-16 h-6 skeleton rounded" />
    </div>
  )
}

export function ToReviewList({
  transactions, categories, accounts, selectedIds, onSelectAll, onSelect, onReview, onDelete, loading
}: ToReviewListProps) {
  if (loading && !transactions.length) {
    return (
      <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden">
        {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <EmptyState
        icon={<CheckSquare size={24} />}
        title="Nothing to review"
        description="Imported transactions will appear here for review before being added to your ledger."
      />
    )
  }

  const allSelected = transactions.length > 0 && transactions.every(t => selectedIds.has(t.id))

  return (
    <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden">
      {/* Column header — same widths as ReviewRow */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
        <div className={COL.checkbox}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={e => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 cursor-pointer"
          />
        </div>
        <div className={COL.date}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Date</span>
        </div>
        <div className={COL.description}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Description</span>
        </div>
        <div className={COL.category}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Category</span>
        </div>
        <div className={COL.notes}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Notes</span>
        </div>
        <div className={COL.type}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Type</span>
        </div>
        <div className={COL.amount}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Amount</span>
        </div>
        <div className={COL.actions}>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 text-right block">
            {selectedIds.size > 0 ? `${selectedIds.size}/${transactions.length}` : `${transactions.length} pending`}
          </span>
        </div>
      </div>

      {transactions.map(t => (
        <ReviewRow
          key={t.id}
          transaction={t}
          categories={categories}
          selected={selectedIds.has(t.id)}
          onSelect={onSelect}
          onReview={onReview}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
