import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react'
import { BudgetGroup, BudgetCategory, SpendingCategory } from '../../types'
import { CategoryRow } from './CategoryRow'

interface CategoryGroupProps {
  group: BudgetGroup
  categories: BudgetCategory[]
  spendingData: SpendingCategory[]
  onToggle: (id: string) => void
  onEditBudget: (categoryId: string, amount: number) => void
  onOpenModal: (categoryId: string) => void
  onAddCategory: (groupId: string) => void
  onDeleteGroup: (id: string) => void
  onRenameGroup: (id: string, name: string) => void
}

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function CategoryGroup({
  group, categories, spendingData, onToggle, onEditBudget, onOpenModal,
  onAddCategory, onDeleteGroup, onRenameGroup,
}: CategoryGroupProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.select()
  }, [isEditing])

  const groupAssigned = categories.reduce((sum, cat) => sum + cat.budget_amount, 0)
  const groupActivity = categories.reduce((sum, cat) => {
    const s = spendingData.find(d => d.category === cat.name)
    return sum + (s ? Math.abs(s.amount) : 0)
  }, 0)
  const groupAvailable = groupAssigned - groupActivity

  const commitRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== group.name) {
      onRenameGroup(group.id, trimmed)
    }
    setIsEditing(false)
  }

  return (
    <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden mb-3">
      {/* Group header */}
      <div className="relative flex items-center gap-3 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-border-light dark:border-border-dark group/header">
        <button
          onClick={() => !isEditing && onToggle(group.id)}
          className="flex items-center gap-2 w-52 flex-shrink-0 text-left hover:opacity-80 transition-opacity"
        >
          <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">
            {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </span>
          {isEditing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') { setEditName(group.name); setIsEditing(false) }
              }}
              onClick={e => e.stopPropagation()}
              className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wide bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-accent-500 rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            />
          ) : (
            <span className="min-w-0 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide truncate">
              {group.name}
            </span>
          )}
        </button>
        <span className="text-xs font-money text-gray-500 dark:text-gray-400 w-28 text-right flex-shrink-0">
          {formatMoney(groupAssigned)}
        </span>
        <span className="text-xs font-money text-gray-900 dark:text-gray-100 w-28 text-right flex-shrink-0">
          {formatMoney(groupActivity)}
        </span>
        <span className="text-xs font-money text-gray-500 dark:text-gray-400 w-32 flex-shrink-0 text-right">
          {formatMoney(groupAvailable)}
        </span>

        {/* Edit + Delete — absolutely positioned over the right edge, no layout impact */}
        {confirmDelete ? (
          <div className="absolute right-3 flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-800 pl-2">
            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {categories.length > 0
                ? `Delete + ${categories.length} ${categories.length === 1 ? 'category' : 'categories'}?`
                : 'Delete group?'}
            </span>
            <button onClick={() => onDeleteGroup(group.id)} className="text-status-negative hover:underline font-medium">
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              Cancel
            </button>
          </div>
        ) : (
          <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-all">
            <button
              onClick={e => { e.stopPropagation(); setEditName(group.name); setIsEditing(true) }}
              className="p-1 rounded text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              title="Rename group"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1 rounded text-gray-400 hover:text-status-negative transition-colors"
              title="Delete group"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Categories */}
      {!group.collapsed && (
        <div>
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 px-3 py-2">No categories in this group.</p>
          ) : (
            categories.map(cat => {
              const spending = spendingData.find(d => d.category === cat.name)
              return (
                <CategoryRow
                  key={cat.id}
                  category={cat}
                  spent={spending ? Math.abs(spending.amount) : 0}
                  onEditBudget={onEditBudget}
                  onOpenModal={onOpenModal}
                />
              )
            })
          )}

          <button
            onClick={() => onAddCategory(group.id)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors w-full"
          >
            <Plus size={12} />
            Add Category
          </button>
        </div>
      )}
    </div>
  )
}
