import { useState, useRef } from 'react'
import { Transaction, TransactionType, TransactionUpdate } from '../../types'
import { EmptyState } from '../common/EmptyState'
import { CheckSquare, Check, Trash2, Pencil, X, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { CategoryDropdown } from './CategoryDropdown'
import { TypeDropdown } from './TypeDropdown'
import { getCategoryColor, getCategoryDotColor } from '../ui/Badge'

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
  actions:     'w-20 flex-shrink-0',
}

const inputCls = 'w-full text-sm px-1.5 py-0.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500'

const TYPE_STYLES: Record<TransactionType, { label: string; cls: string; Icon: typeof TrendingDown }> = {
  expense:  { label: 'Expense',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',                          Icon: TrendingDown },
  income:   { label: 'Income',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon: TrendingUp },
  transfer: { label: 'Transfer', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',                     Icon: ArrowRightLeft },
}

function TypeBadge({ type }: { type: TransactionType }) {
  const cfg = TYPE_STYLES[type] ?? TYPE_STYLES.expense
  return (
    <span className={clsx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap', cfg.cls)}>
      <cfg.Icon size={9} />
      {cfg.label}
    </span>
  )
}

function formatAmount(amount: number): { text: string; cls: string } {
  const abs = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (amount >= 0) return { text: `+$${abs}`, cls: 'text-emerald-600 dark:text-emerald-400' }
  return { text: `$${abs}`, cls: 'text-gray-700 dark:text-gray-300' }
}

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
  const [editing, setEditing]       = useState(false)
  const [type, setType]             = useState<TransactionType>(t.transaction_type)
  const [desc, setDesc]             = useState(t.description)
  const [date, setDate]             = useState(t.date)
  const [amount, setAmount]         = useState(String(Math.abs(t.amount)))
  const [category, setCat]          = useState(t.category ?? '')
  const [notes, setNotes]           = useState(t.notes ?? '')
  const [saving, setSaving]         = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [editingCat, setEditingCat] = useState(false)
  const [catSearch, setCatSearch]   = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCats = catSearch
    ? categories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()))
    : categories

  const handleCatSelect = async (cat: string) => {
    setSaving(true)
    setEditingCat(false)
    setCatSearch('')
    try { await onReview(t.id, { category: cat }) }
    finally { setSaving(false) }
  }

  const dateLabel = (() => { try { return format(parseISO(t.date), 'MMM d') } catch { return t.date } })()
  const amt = formatAmount(t.amount)

  const handleReviewEdit = async () => {
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

  const handleQuickReview = async () => {
    setSaving(true)
    try {
      await onReview(t.id, { reviewed: true })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(t.id) }
    finally { setDeleting(false) }
  }

  const cancelEdit = () => {
    setType(t.transaction_type)
    setDesc(t.description)
    setDate(t.date)
    setAmount(String(Math.abs(t.amount)))
    setCat(t.category ?? '')
    setNotes(t.notes ?? '')
    setConfirmDel(false)
    setEditing(false)
  }

  const rowBase = clsx(
    'flex items-center gap-3 px-4 border-b border-border-light dark:border-border-dark last:border-0',
    selected ? 'bg-accent-50/60 dark:bg-accent-900/15' : 'bg-amber-50/30 dark:bg-amber-900/5',
  )

  const checkboxEl = (
    <div className={COL.checkbox}>
      <input
        type="checkbox"
        checked={selected}
        onChange={e => onSelect(t.id, e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 cursor-pointer"
      />
    </div>
  )

  const deleteActions = confirmDel ? (
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
  ) : null

  // ── Edit Mode ─────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className={clsx(rowBase, 'py-1.5')}>
        {checkboxEl}

        <div className={COL.date}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
        </div>

        <div className={COL.description}>
          <input value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} />
        </div>

        <div className={COL.category}>
          {type === 'expense' && (
            <CategoryDropdown value={category} categories={categories} onChange={setCat} />
          )}
        </div>

        <div className={COL.notes}>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes..."
            className={clsx(inputCls, 'text-xs')}
          />
        </div>

        <div className={COL.type}>
          <TypeDropdown value={type} onChange={setType} />
        </div>

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

        <div className={clsx('flex items-center gap-1 justify-end', COL.actions)}>
          {confirmDel ? deleteActions : (
            <>
              <button
                onClick={handleReviewEdit}
                disabled={saving}
                title="Save & Mark as Reviewed"
                className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelEdit}
                title="Cancel"
                className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={13} />
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

  // ── View Mode ─────────────────────────────────────────────────────────────
  return (
    <div className={clsx(rowBase, 'py-2')}>
      {checkboxEl}

      <span className={clsx('text-xs text-gray-500 dark:text-gray-400', COL.date)}>{dateLabel}</span>

      <div className={COL.description}>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</p>
      </div>

      <div className={clsx('relative', COL.category)}>
        {t.transaction_type === 'expense' && (
          <>
            <button
              onClick={() => setEditingCat(e => !e)}
              disabled={saving}
              className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium transition-all max-w-full truncate',
                t.category ? getCategoryColor(t.category) : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                'hover:opacity-90 cursor-pointer',
                saving && 'opacity-50',
              )}
            >
              {saving ? '…' : (t.category ?? 'Uncategorized')}
            </button>
            {editingCat && (
              <div
                ref={dropdownRef}
                className="absolute top-full mt-1 left-0 z-20 w-52 bg-surface dark:bg-[#171717] rounded-lg border border-border-light dark:border-border-dark shadow-soft overflow-hidden"
              >
                <div className="p-2 border-b border-border-light dark:border-border-dark">
                  <input
                    autoFocus
                    value={catSearch}
                    onChange={e => setCatSearch(e.target.value)}
                    onBlur={() => setTimeout(() => { setEditingCat(false); setCatSearch('') }, 150)}
                    placeholder="Search..."
                    className="w-full text-xs px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {filteredCats.map(cat => (
                    <button
                      key={cat}
                      onMouseDown={() => handleCatSelect(cat)}
                      className="w-full text-left text-xs px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryDotColor(cat) }} />
                      {cat}
                    </button>
                  ))}
                  {filteredCats.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">No matches</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={clsx(COL.notes, 'overflow-hidden')}>
        {t.notes
          ? <span className="text-xs text-gray-400 dark:text-gray-500 truncate block" title={t.notes}>{t.notes}</span>
          : null}
      </div>

      <div className={COL.type}>
        <TypeBadge type={t.transaction_type} />
      </div>

      <span className={clsx('font-money font-semibold text-sm text-right', COL.amount, amt.cls)}>
        {amt.text}
      </span>

      <div className={clsx('flex items-center gap-1 justify-end', COL.actions)}>
        {confirmDel ? deleteActions : (
          <>
            <button
              onClick={() => setEditing(true)}
              title="Edit"
              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={handleQuickReview}
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
      <div className="w-20 h-6 skeleton rounded" />
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
      {/* Column headers */}
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
