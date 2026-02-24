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
  const groupAssigned = categories.reduce((sum, cat) => sum + cat.budgetAmount, 0)
  const groupActivity = categories.reduce((sum, cat) => {
    const s = spendingData.find(d => d.category === cat.name)
    return sum + (s ? Math.abs(s.amount) : 0)
  }, 0)
  const groupAvailable = groupAssigned - groupActivity

  return (
    <div className="rounded-lg border border-border-light dark:border-border-dark bg-surface dark:bg-[#171717] overflow-hidden mb-3">
      {/* Group header */}
      <button
        onClick={() => onToggle(group.id)}
        className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-150 dark:hover:bg-gray-750 transition-colors text-left border-b border-border-light dark:border-border-dark"
      >
        <span className="text-gray-400 dark:text-gray-500">
          {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
        <span className="flex-1 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          {group.name}
        </span>
        <span className="text-xs font-money text-gray-500 dark:text-gray-400 w-28 text-right">
          {formatMoney(groupAssigned)}
        </span>
        <span className="text-xs font-money text-gray-900 dark:text-gray-100 w-28 text-right">
          {formatMoney(groupActivity)}
        </span>
        <span className="text-xs font-money text-gray-500 dark:text-gray-400 w-32 text-right">
          {formatMoney(groupAvailable)}
        </span>
      </button>

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
