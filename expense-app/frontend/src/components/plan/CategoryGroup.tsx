import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
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
  onDeleteCategory: (id: string) => void
}

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function CategoryGroup({
  group, categories, spendingData, onToggle, onEditBudget, onOpenModal,
  onAddCategory, onDeleteGroup, onDeleteCategory,
}: CategoryGroupProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const groupAssigned = categories.reduce((sum, cat) => sum + cat.budget_amount, 0)
  const groupActivity = categories.reduce((sum, cat) => {
    const s = spendingData.find(d => d.category === cat.name)
    return sum + (s ? Math.abs(s.amount) : 0)
  }, 0)
  const groupAvailable = groupAssigned - groupActivity

  return (
    <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden mb-3">
      {/* Group header */}
      <div className="relative flex items-center gap-3 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border-b border-border-light dark:border-border-dark group/header">
        <button
          onClick={() => onToggle(group.id)}
          className="flex items-center gap-2 w-52 flex-shrink-0 text-left hover:opacity-80 transition-opacity"
        >
          <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">
            {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </span>
          <span className="min-w-0 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide truncate">
            {group.name}
          </span>
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

        {/* Delete — absolutely positioned over the right edge, no layout impact */}
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
          <button
            onClick={() => setConfirmDelete(true)}
            className="absolute right-2 opacity-0 group-hover/header:opacity-100 p-1 rounded text-gray-400 hover:text-status-negative transition-all"
          >
            <Trash2 size={13} />
          </button>
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
                  onDelete={onDeleteCategory}
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
