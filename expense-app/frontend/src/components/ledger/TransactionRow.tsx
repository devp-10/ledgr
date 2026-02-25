import { useState, useRef, useEffect } from 'react'
import { Transaction, TransactionType } from '../../types'
import { getCategoryColor, getCategoryDotColor } from '../ui/Badge'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { Pencil, Trash2, TrendingUp, TrendingDown, ArrowRightLeft, Check, X } from 'lucide-react'

interface TransactionRowProps {
  transaction: Transaction
  categories: string[]
  accounts: { id: number; name: string }[]
  selected: boolean
  onSelect: (id: number, checked: boolean) => void
  onPatch: (id: number, update: Partial<{ category: string | null; transaction_type: TransactionType; description: string; date: string; amount: number; notes: string; account_id: number | null }>) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

function formatAmount(amount: number): { text: string; cls: string } {
  const abs = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (amount >= 0) {
    return { text: `+$${abs}`, cls: 'text-emerald-600 dark:text-emerald-400' }
  }
  return { text: `$${abs}`, cls: 'text-gray-700 dark:text-gray-300' }
}

const TYPE_STYLES: Record<TransactionType, { label: string; cls: string; Icon: typeof TrendingDown }> = {
  expense:  { label: 'Expense',  cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         Icon: TrendingDown },
  income:   { label: 'Income',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon: TrendingUp },
  transfer: { label: 'Transfer', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     Icon: ArrowRightLeft },
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

const inputCls = 'w-full text-sm px-1.5 py-0.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500'

export function TransactionRow({ transaction: t, categories, accounts, selected, onSelect, onPatch, onDelete }: TransactionRowProps) {
  const [editing, setEditing] = useState(false)
  const [editingCat, setEditingCat] = useState(false)
  const [catSearch, setCatSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [editDate, setEditDate]     = useState(t.date)
  const [editDesc, setEditDesc]     = useState(t.description)
  const [editCat, setEditCat]       = useState(t.category ?? '')
  const [editNotes, setEditNotes]   = useState(t.notes ?? '')
  const [editType, setEditType]     = useState<TransactionType>(t.transaction_type)
  const [editAmount, setEditAmount] = useState(String(Math.abs(t.amount)))
  const [editAccount, setEditAccount] = useState<number | ''>(t.account_id ?? '')

  useEffect(() => {
    setEditDate(t.date)
    setEditDesc(t.description)
    setEditCat(t.category ?? '')
    setEditNotes(t.notes ?? '')
    setEditType(t.transaction_type)
    setEditAmount(String(Math.abs(t.amount)))
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const raw = parseFloat(editAmount) || 0
      const signed = editType === 'expense' ? -Math.abs(raw) : Math.abs(raw)
      await onPatch(t.id, {
        date: editDate,
        description: editDesc,
        category: editCat || null,
        notes: editNotes,
        transaction_type: editType,
        amount: signed,
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

  const handleCancelEdit = () => {
    setEditDate(t.date)
    setEditDesc(t.description)
    setEditCat(t.category ?? '')
    setEditNotes(t.notes ?? '')
    setEditType(t.transaction_type)
    setEditAmount(String(Math.abs(t.amount)))
    setEditAccount(t.account_id ?? '')
    setEditing(false)
  }

  const amt = formatAmount(t.amount)
  const dateLabel = (() => { try { return format(parseISO(t.date), 'MMM d') } catch { return t.date } })()

  // ── Edit Mode ────────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className={clsx(
        'flex items-center gap-3 px-4 py-1.5 border-b border-border-light dark:border-border-dark',
        'bg-accent-50/40 dark:bg-accent-900/10',
      )}>
        {/* Checkbox placeholder */}
        <input
          type="checkbox"
          checked={selected}
          onChange={e => onSelect(t.id, e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-accent-500 focus:ring-accent-500 cursor-pointer flex-shrink-0"
        />

        {/* Date */}
        <div className="w-[88px] flex-shrink-0">
          <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className={inputCls} />
        </div>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className={inputCls} />
        </div>

        {/* Category */}
        <div className="w-32 flex-shrink-0">
          {editType === 'transfer' ? (
            <span className="text-xs text-gray-400 italic">Transfer</span>
          ) : (
            <select
              value={editCat}
              onChange={e => setEditCat(e.target.value)}
              className={clsx(inputCls, 'text-xs')}
            >
              <option value="">Uncategorized</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>

        {/* Notes */}
        <div className="w-24 flex-shrink-0 hidden lg:block">
          <input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes..." className={clsx(inputCls, 'text-xs')} />
        </div>

        {/* Type */}
        <div className="w-[84px] flex-shrink-0">
          <select
            value={editType}
            onChange={e => setEditType(e.target.value as TransactionType)}
            className={clsx(inputCls, 'text-xs capitalize')}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>

        {/* Amount */}
        <div className="w-24 flex-shrink-0">
          <input
            type="number"
            step="0.01"
            min="0"
            value={editAmount}
            onChange={e => setEditAmount(e.target.value)}
            className={clsx(inputCls, 'text-right')}
          />
        </div>

        {/* Save / Cancel */}
        <div className="flex items-center gap-1 flex-shrink-0 w-16 justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            title="Save"
            className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
          >
            <Check size={14} />
          </button>
          <button
            onClick={handleCancelEdit}
            title="Cancel"
            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  // ── View Mode ────────────────────────────────────────────────────────────────
  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-2 transition-colors border-b border-border-light dark:border-border-dark last:border-0 group',
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
      <span className="text-xs text-gray-500 dark:text-gray-400 w-[88px] flex-shrink-0">{dateLabel}</span>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{t.description}</p>
      </div>

      {/* Category */}
      <div className="relative w-32 flex-shrink-0">
        {t.transaction_type === 'transfer' ? (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Transfer</span>
        ) : (
          <>
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
                  {filteredCats.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">No matches</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      <div className="w-24 flex-shrink-0 hidden lg:block overflow-hidden">
        {t.notes ? (
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate block" title={t.notes}>{t.notes}</span>
        ) : null}
      </div>

      {/* Type */}
      <div className="w-[84px] flex-shrink-0">
        <TypeBadge type={t.transaction_type} />
      </div>

      {/* Amount */}
      <span className={clsx('font-money font-semibold text-sm flex-shrink-0 w-24 text-right', amt.cls)}>
        {amt.text}
      </span>

      {/* Actions — only Edit + Delete, visible on hover */}
      <div className="flex items-center gap-0.5 flex-shrink-0 w-16 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          title="Edit"
          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Pencil size={13} />
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
    </div>
  )
}
