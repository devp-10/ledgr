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
    <div className="glass rounded-2xl overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => onToggle(group.id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/02 transition-colors text-left"
      >
        <span className="text-white/30">
          {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </span>
        <span className="flex-1 text-xs font-semibold text-white/50 uppercase tracking-widest">
          {group.name}
        </span>
        <span className="text-xs font-money text-white/30">
          {formatMoney(groupSpending)} / {formatMoney(groupBudget)}
        </span>
      </button>

      {/* Categories */}
      {!group.collapsed && (
        <div className="border-t border-white/05 px-1 py-1">
          {categories.length === 0 ? (
            <p className="text-xs text-white/25 px-3 py-2">No categories in this group.</p>
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
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/25 hover:text-primary-400 transition-colors w-full"
          >
            <Plus size={12} />
            Add Category
          </button>
        </div>
      )}
    </div>
  )
}
