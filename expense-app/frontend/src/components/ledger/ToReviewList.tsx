import { useState } from 'react'
import { Transaction, TransactionType, TransactionUpdate } from '../../types'
import { EmptyState } from '../common/EmptyState'
import { CheckCheck, Trash2, CheckSquare } from 'lucide-react'
import { Button } from '../ui/Button'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { getCategoryColor } from '../ui/Badge'

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

function ReviewRow({
  transaction: t,
  categories,
  accounts,
  selected,
  onSelect,
  onReview,
  onDelete,
}: {
  transaction: Transaction
  categories: string[]
  accounts: { id: number; name: string }[]
  selected: boolean
  onSelect: (id: number, checked: boolean) => void
  onReview: (id: number, update: Partial<TransactionUpdate>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [type, setType] = useState<TransactionType>(t.transaction_type)
  const [desc, setDesc] = useState(t.description)
  const [date, setDate] = useState(t.date)
  const [amount, setAmount] = useState(String(Math.abs(t.amount)))
  const [category, setCategory] = useState(t.category ?? '')
  const [account, setAccount] = useState<number | ''>(t.account_id ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const inputCls = 'w-full text-xs px-2 py-1 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500'

  const handleReview = async () => {
    setSaving(true)
    try {
      const rawAmount = parseFloat(amount) || 0
      const signedAmount = type === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount)
      await onReview(t.id, {
        description: desc,
        date,
        amount: signedAmount,
        transaction_type: type,
        category: category || undefined,
        account_id: account !== '' ? Number(account) : null,
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

  const dateLabel = (() => { try { return format(parseISO(t.date), 'MMM d') } catch { return t.date } })()

  return (
    <div className={clsx(
      'border-b border-border-light dark:border-border-dark last:border-0 transition-colors',
      selected ? 'bg-accent-50 dark:bg-accent-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-white/[0.01]'
    )}>
      <div className="px-4 py-3 space-y-2.5">
        {/* Top: checkbox + original info */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(t.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 cursor-pointer flex-shrink-0"
          />
          <span className="text-xs text-gray-400 dark:text-gray-500 w-10 flex-shrink-0">{dateLabel}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 truncate italic">Imported: {t.description}</span>
          <span className="text-xs font-money font-semibold text-gray-700 dark:text-gray-300">
            {t.amount < 0 ? `-$${Math.abs(t.amount).toFixed(2)}` : `+$${t.amount.toFixed(2)}`}
          </span>
        </div>

        {/* Edit fields */}
        <div className="ml-6 grid grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Type */}
          <div className="col-span-2 lg:col-span-1">
            <label className="block text-[10px] text-gray-400 mb-0.5">Type</label>
            <div className="flex gap-1">
              {(['expense', 'income', 'transfer'] as TransactionType[]).map(tp => (
                <button
                  key={tp}
                  onClick={() => setType(tp)}
                  className={clsx(
                    'flex-1 px-1.5 py-1 rounded text-[10px] font-semibold capitalize transition-colors',
                    type === tp
                      ? 'bg-accent-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {tp.charAt(0).toUpperCase() + tp.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className="block text-[10px] text-gray-400 mb-0.5">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className={inputCls} />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Amount</label>
            <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} />
          </div>

          {/* Category (not for transfers) */}
          {type !== 'transfer' && (
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">
                {type === 'income' ? 'Category (Ready to Assign)' : 'Category'}
              </label>
              {type === 'income' ? (
                <div className={clsx('px-2 py-1 rounded text-xs font-medium', getCategoryColor('Income'))}>
                  Ready to Assign
                </div>
              ) : (
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </div>
          )}

          {/* Account */}
          {accounts.length > 0 && (
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Account</label>
              <select
                value={account}
                onChange={e => setAccount(e.target.value !== '' ? Number(e.target.value) : '')}
                className={inputCls}
              >
                <option value="">No account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-6 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={handleReview}
          >
            <CheckCheck size={13} /> Mark as Reviewed
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
          >
            <Trash2 size={13} /> Delete
          </Button>
        </div>
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3 border-b border-border-light dark:border-border-dark space-y-2">
      <div className="flex gap-2">
        <div className="w-4 h-4 skeleton rounded" />
        <div className="flex-1 h-4 skeleton" />
        <div className="w-20 h-4 skeleton" />
      </div>
      <div className="ml-6 grid grid-cols-4 gap-2">
        <div className="h-7 skeleton rounded" />
        <div className="h-7 skeleton rounded col-span-2" />
        <div className="h-7 skeleton rounded" />
      </div>
    </div>
  )
}

export function ToReviewList({
  transactions, categories, accounts, selectedIds, onSelectAll, onSelect, onReview, onDelete, loading
}: ToReviewListProps) {
  if (loading && !transactions.length) {
    return (
      <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden">
        {[1,2,3].map(i => <SkeletonRow key={i} />)}
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
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={e => onSelectAll(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 cursor-pointer"
        />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {selectedIds.size > 0 ? `${selectedIds.size} selected of ${transactions.length}` : `${transactions.length} pending review`}
        </span>
      </div>
      {transactions.map(t => (
        <ReviewRow
          key={t.id}
          transaction={t}
          categories={categories}
          accounts={accounts}
          selected={selectedIds.has(t.id)}
          onSelect={onSelect}
          onReview={onReview}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
