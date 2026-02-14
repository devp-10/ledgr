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
  if (pct >= 100) return <Circle size={12} className="text-danger-500 fill-danger-500" />
  if (pct >= 80) return <AlertTriangle size={12} className="text-warning-500" />
  return <Check size={12} className="text-success-500" />
}

export function CategoryRow({ category, spent, onEditBudget, onOpenModal }: CategoryRowProps) {
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(String(category.budgetAmount))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const pct = category.budgetAmount > 0 ? (spent / category.budgetAmount) * 100 : 0

  const commitEdit = () => {
    const n = parseFloat(editVal.replace(/[^0-9.]/g, ''))
    if (!isNaN(n) && n >= 0) onEditBudget(category.id, n)
    setEditing(false)
  }

  return (
    <div className="group flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
      {/* Emoji + name */}
      <div className="flex items-center gap-2 w-36 flex-shrink-0">
        <span className="text-sm">{category.emoji ?? '📦'}</span>
        <button
          onClick={() => onOpenModal(category.id)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left truncate"
        >
          {category.name}
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <Progress value={pct} size="sm" />
      </div>

      {/* Status + amounts */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-1">
        <StatusIcon pct={pct} />
        <span className={clsx(
          'text-xs font-money',
          pct >= 100 ? 'text-danger-500' : pct >= 80 ? 'text-warning-500' : 'text-gray-500 dark:text-gray-400'
        )}>
          {formatMoney(spent)}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-600">/</span>

        {/* Editable budget amount */}
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">$</span>
            <input
              ref={inputRef}
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
              className="w-16 text-xs font-money bg-white dark:bg-gray-700 border border-primary-500 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        ) : (
          <button
            onClick={() => { setEditVal(String(category.budgetAmount)); setEditing(true) }}
            className="flex items-center gap-1 text-xs font-money text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 group/edit"
          >
            {formatMoney(category.budgetAmount)}
            <Pencil size={10} className="opacity-0 group-hover/edit:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
    </div>
  )
}
