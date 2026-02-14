import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { DashboardSummary, BudgetCategory } from '../types'
import { useBudgets } from '../hooks/useBudgets'
import { MonthlyOverview } from '../components/plan/MonthlyOverview'
import { CategoryGroup } from '../components/plan/CategoryGroup'
import { CategoryModal } from '../components/plan/CategoryModal'
import { MonthPicker } from '../components/common/MonthPicker'
import { Button } from '../components/ui/Button'
import { useToastContext } from '../App'

export function Plan() {
  const addToast = useToastContext()
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [addGroupName, setAddGroupName] = useState('')
  const [showAddGroup, setShowAddGroup] = useState(false)

  const { groups, categories, toggleGroup, updateBudget, addCategory, updateCategory, deleteCategory, addGroup } = useBudgets()

  useEffect(() => {
    setLoading(true)
    api.getDashboard(month)
      .then(setSummary)
      .catch(() => addToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false))
  }, [month]) // eslint-disable-line

  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgetAmount, 0)
  const selectedCategory = categories.find(c => c.id === selectedCategoryId) ?? null

  const handleAddCategory = (groupId: string) => {
    const id = `cat-${Date.now()}`
    addCategory({ id, name: 'New Category', group: groupId, budgetAmount: 100, emoji: '📦', rules: [] })
    setSelectedCategoryId(id)
    addToast('Category added', 'success')
  }

  const handleAddGroup = () => {
    if (!addGroupName.trim()) return
    addGroup(addGroupName.trim())
    setAddGroupName('')
    setShowAddGroup(false)
    addToast('Group added', 'success')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <MonthPicker value={month} onChange={setMonth} />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Budget targets are stored locally
        </p>
      </div>

      {/* Monthly overview */}
      <MonthlyOverview
        summary={summary}
        totalBudgeted={totalBudgeted}
        loading={loading}
      />

      {/* Section header */}
      <div className="flex items-center justify-between mt-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Category Groups
        </h2>
      </div>

      {/* Category groups */}
      <div className="space-y-3">
        {groups.map(group => {
          const groupCats = categories.filter(c => c.group === group.id)
          return (
            <CategoryGroup
              key={group.id}
              group={group}
              categories={groupCats}
              spendingData={summary?.spending_by_category ?? []}
              onToggle={toggleGroup}
              onEditBudget={updateBudget}
              onOpenModal={setSelectedCategoryId}
              onAddCategory={handleAddCategory}
            />
          )
        })}
      </div>

      {/* Add group */}
      <div>
        {showAddGroup ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={addGroupName}
              onChange={e => setAddGroupName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); if (e.key === 'Escape') setShowAddGroup(false) }}
              placeholder="Group name..."
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400"
            />
            <Button variant="primary" size="sm" onClick={handleAddGroup}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddGroup(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setShowAddGroup(true)}>
            <Plus size={14} /> Add Category Group
          </Button>
        )}
      </div>

      {/* Category modal */}
      <CategoryModal
        category={selectedCategory}
        groups={groups}
        open={!!selectedCategoryId}
        onClose={() => setSelectedCategoryId(null)}
        onSave={(id, changes) => { updateCategory(id, changes as Partial<BudgetCategory>); addToast('Category saved', 'success') }}
        onDelete={id => { deleteCategory(id); addToast('Category deleted', 'info') }}
      />
    </div>
  )
}
