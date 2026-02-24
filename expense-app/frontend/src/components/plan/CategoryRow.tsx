import { useState, useRef, useEffect } from 'react'
import { Check, AlertTriangle, Circle, Pencil } from 'lucide-react'
import { BudgetCategory } from '../../types'
import { Progress } from '../ui/Progress'
import { clsx } from 'clsx'

interface CategoryRowProps {
  category: BudgetCategory
  spent: number
  onEditBudget: (id: string, amount: number) => void
  onOpenModal: (id: string) => void
}

function formatMoney(n: number) {
  return '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function StatusIcon({ pct }: { pct: number }) {
  if (pct >= 100) return <Circle size={10} className="text-status-negative fill-status-negative" />
  if (pct >= 80) return <AlertTriangle size={10} className="text-status-warning" />
  return <Check size={10} className="text-status-positive" />
}

export function CategoryRow({ category, spent, onEditBudget, onOpenModal }: CategoryRowProps) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(String(category.budgetAmount))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const pct = category.budgetAmount > 0 ? (spent / category.budgetAmount) * 100 : 0
  const available = category.budgetAmount - spent

  const commitEdit = () => {
    const n = parseFloat(editVal.replace(/[^0-9.]/g, ''))
    if (!isNaN(n) && n >= 0) onEditBudget(category.id, n)
    setEditing(false)
  }

  return (
    <div className="group flex items-center gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
      {/* Name */}
      <button
        onClick={() => onOpenModal(category.id)}
        className="flex items-center gap-2 w-52 flex-shrink-0 text-left"
      >
        <span className="text-sm">{category.emoji ?? '📦'}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors truncate">
          {category.name}
        </span>
      </button>

      {/* Assigned (editable) */}
      <div className="w-28 flex-shrink-0 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-1">
            <span className="text-xs text-gray-400">$</span>
            <input
              ref={inputRef}
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="w-20 text-sm font-money text-right px-2 py-1 rounded-md border border-accent-500 bg-surface dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          </div>
        ) : (
          <button
            onClick={() => {
              setEditVal(String(category.budgetAmount))
              setEditing(true)
            }}
            className="flex items-center gap-1 text-sm font-money text-gray-600 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 group/edit transition-colors ml-auto"
          >
            {formatMoney(category.budgetAmount)}
            <Pencil size={10} className="opacity-0 group-hover/edit:opacity-60 transition-opacity" />
          </button>
        )}
      </div>

      {/* Activity (spent) */}
      <div className="w-28 flex-shrink-0 text-right">
        <span className="text-sm font-money text-gray-900 dark:text-gray-100">
          {formatMoney(spent)}
        </span>
      </div>

      {/* Available (pill) */}
      <div className="w-32 flex-shrink-0 text-right">
        <span
          className={clsx(
            'status-pill',
            available > 0 ? 'positive' : available === 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : 'negative'
          )}
        >
          {formatMoney(available)}
        </span>
      </div>
    </div>
  )
}
