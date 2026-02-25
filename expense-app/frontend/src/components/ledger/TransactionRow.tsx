import { useState, useRef, useEffect } from 'react'
import { Transaction, TransactionType } from '../../types'
import { getCategoryColor, getCategoryDotColor } from '../ui/Badge'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { Pencil, Trash2, Scissors, Copy, ArrowRightLeft, TrendingUp, TrendingDown, X, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { SplitModal } from './SplitModal'

interface TransactionRowProps {
  transaction: Transaction
  categories: string[]
  accounts: { id: number; name: string }[]
  selected: boolean
  onSelect: (id: number, checked: boolean) => void
  onPatch: (id: number, update: Partial<{ category: string; transaction_type: TransactionType; description: string; date: string; amount: number; notes: string; account_id: number | null }>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onDuplicate: (id: number) => Promise<void>
  onSplit?: (id: number, splits: { amount: number; category?: string; description: string }[]) => Promise<void>
}

function formatMoney(n: number) {
  return Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function TypeBadge({ type }: { type: TransactionType }) {
  const cfg = {
    expense: { label: 'Expense', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', Icon: TrendingDown },
    income:  { label: 'Income',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon: TrendingUp },
    transfer:{ label: 'Transfer',cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', Icon: ArrowRightLeft },
  }[type] ?? { label: type, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-400', Icon: TrendingDown }

  return (
    <span className={clsx('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide', cfg.cls)}>
      <cfg.Icon size={9} />
      {cfg.label}
    </span>
  )
}

export function TransactionRow({
  transaction: t, categories, accounts, selected, onSelect, onPatch, onDelete, onDuplicate, onSplit
}: TransactionRowProps) {
  const [editing, setEditing] = useState(false)
  const [editingCat, setEditingCat] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [splitOpen, setSplitOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Inline edit state
  const [editDesc, setEditDesc] = useState(t.description)
  const [editDate, setEditDate] = useState(t.date)
  const [editAmount, setEditAmount] = useState(String(Math.abs(t.amount)))
  const [editType, setEditType] = useState<TransactionType>(t.transaction_type)
  const [editNotes, setEditNotes] = useState(t.notes ?? '')
  const [editAccount, setEditAccount] = useState<number | ''>(t.account_id ?? '')

  // Reset edit state when transaction changes
  useEffect(() => {
    setEditDesc(t.description)
    setEditDate(t.date)
    setEditAmount(String(Math.abs(t.amount)))
    setEditType(t.transaction_type)
    setEditNotes(t.notes ?? '')
    setEditAccount(t.account_id ?? '')
  }, [t])

  const filteredCats = catSearch
    ? categories.filter(c => c.toLowerCase().includes(catSearch.toLowerCase()))
    : categories

  const handleCatSelect = async (cat: string) => {
    setSaving(true)
    setEditingCat(false)
    setCatSearch('')
    try { await onPatch(t.id, { category: cat }) }
    finally { setSaving(false) }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const rawAmount = parseFloat(editAmount) || 0
      const signedAmount = editType === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount)
      await onPatch(t.id, {
        description: editDesc,
        date: editDate,
        amount: signedAmount,
        transaction_type: editType,
        notes: editNotes,
        account_id: editAccount !== '' ? Number(editAccount) : null,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(t.id) }
    finally { setDeleting(false) }
  }

  const handleDuplicate = async () => {
    setSaving(true)
    try { await onDuplicate(t.id) }
    finally { setSaving(false) }
  }

  const outflow = t.amount < 0 ? formatMoney(t.amount) : ''
  const inflow = t.amount >= 0 ? formatMoney(t.amount) : ''
  const dateLabel = (() => { try { return format(parseISO(t.date), 'MMM d') } catch { return t.date } })()

  if (editing) {
    return (
      <div className="px-4 py-3 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/60 space-y-3">
        {/* Edit header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Edit Transaction</span>
          <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={14} />
          </button>
        </div>
        {/* Type selector */}
        <div className="flex gap-2">
          {(['expense', 'income', 'transfer'] as TransactionType[]).map(tp => (
            <button
              key={tp}
              onClick={() => setEditType(tp)}
              className={clsx(
                'px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors',
                editType === tp
                  ? 'bg-accent-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {tp}
            </button>
          ))}
        </div>
        {/* Fields */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="lg:col-span-2">
            <label className="block text-[10px] text-gray-400 mb-0.5">Description</label>
            <input
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              className="w-full text-sm px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Date</label>
            <input
              type="date"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              className="w-full text-sm px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-400 mb-0.5">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editAmount}
              onChange={e => setEditAmount(e.target.value)}
              className="w-full text-sm px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
          {accounts.length > 0 && (
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">Account</label>
              <select
                value={editAccount}
                onChange={e => setEditAccount(e.target.value !== '' ? Number(e.target.value) : '')}
                className="w-full text-sm px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="">No account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <div className="lg:col-span-2">
            <label className="block text-[10px] text-gray-400 mb-0.5">Notes</label>
            <input
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full text-sm px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSaveEdit}>
            <Check size={13} /> Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={clsx(
      'flex items-center gap-2 px-4 py-2 transition-colors border-b border-border-light dark:border-border-dark last:border-0 group',
      selected ? 'bg-accent-50 dark:bg-accent-900/10' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]',
    )}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={e => onSelect(t.id, e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
      />

      {/* Date */}
      <span className="text-xs text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">{dateLabel}</span>

      {/* Type */}
      <div className="w-[72px] flex-shrink-0">
        <TypeBadge type={t.transaction_type} />
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</p>
      </div>

      {/* Category */}
      {t.transaction_type !== 'transfer' && (
        <div className="relative flex-shrink-0 w-32">
          <button
            onClick={() => setEditingCat(e => !e)}
            disabled={saving}
            className={clsx(
              'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium transition-all max-w-full truncate',
              t.category ? getCategoryColor(t.category) : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
              'hover:opacity-90 cursor-pointer',
              saving && 'opacity-50'
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
                {filteredCats.length === 0 && (
                  <p className="text-xs text-gray-400 px-3 py-2">No matches</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {t.transaction_type === 'transfer' && (
        <div className="w-32 flex-shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Transfer</span>
        </div>
      )}

      {/* Notes/Comments */}
      <div className="w-28 flex-shrink-0 hidden lg:block">
        {t.notes ? (
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate block" title={t.notes}>{t.notes}</span>
        ) : null}
      </div>

      {/* Outflow */}
      <span className="font-money text-sm flex-shrink-0 w-24 text-right text-gray-700 dark:text-gray-300">
        {outflow ? `$${outflow}` : ''}
      </span>

      {/* Amount (inflow) */}
      <span className={clsx(
        'font-money text-sm flex-shrink-0 w-24 text-right font-semibold',
        inflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-transparent select-none'
      )}>
        {inflow ? `$${inflow}` : '$0.00'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          title="Edit"
          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Pencil size={13} />
        </button>
        {t.transaction_type === 'expense' && onSplit && (
          <button
            onClick={() => setSplitOpen(true)}
            title="Split"
            className="p-1 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
          >
            <Scissors size={13} />
          </button>
        )}
        <button
          onClick={handleDuplicate}
          title="Duplicate"
          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={handleDelete}
          title="Delete"
          disabled={deleting}
          className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {splitOpen && onSplit && (
        <SplitModal
          transaction={t}
          categories={categories}
          onSplit={async (splits) => { await onSplit(t.id, splits); setSplitOpen(false) }}
          onClose={() => setSplitOpen(false)}
        />
      )}
    </div>
  )
}
