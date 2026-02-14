import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
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
}

function formatMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function CategoryGroup({
  group, categories, spendingData, onToggle, onEditBudget, onOpenModal, onAddCategory
}: CategoryGroupProps) {
  const groupSpending = categories.reduce((sum, cat) => {
    const s = spendingData.find(d => d.category === cat.name)
    return sum + (s ? Math.abs(s.amount) : 0)
  }, 0)
  const groupBudget = categories.reduce((sum, cat) => sum + cat.budgetAmount, 0)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
      {/* Group header */}
      <button
        onClick={() => onToggle(group.id)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left"
      >
        <span className="text-gray-400 dark:text-gray-500">
          {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
        <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          {group.name}
        </span>
        <span className="text-xs font-money text-gray-500 dark:text-gray-400">
          {formatMoney(groupSpending)} / {formatMoney(groupBudget)}
        </span>
      </button>

      {/* Categories */}
      {!group.collapsed && (
        <div className="border-t border-gray-100 dark:border-gray-700/60 px-1 py-1">
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
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-full"
          >
            <Plus size={12} />
            Add Category
          </button>
        </div>
      )}
    </div>
  )
}
