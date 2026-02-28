import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { DashboardSummary, BudgetCategory } from '../types'
import { useBudgets } from '../hooks/useBudgets'
import { CategoryGroup } from '../components/plan/CategoryGroup'
import { CategoryModal } from '../components/plan/CategoryModal'
import { PlanCharts } from '../components/plan/PlanCharts'
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

  const {
    groups,
    loading: budgetLoading,
    toggleGroup,
    updateBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addGroup,
    deleteGroup,
    renameGroup,
  } = useBudgets()

  useEffect(() => {
    setLoading(true)
    api.getDashboard(month)
      .then(setSummary)
      .catch(() => addToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false))
  }, [month]) // eslint-disable-line

  const allCategories = groups.flatMap(g => g.categories)
  const selectedCategory = allCategories.find(c => c.id === selectedCategoryId) ?? null

  const handleAddCategory = async (groupId: string) => {
    const cat = await addCategory(groupId)
    if (cat) {
      setSelectedCategoryId(cat.id)
      addToast('Category added', 'success')
    } else {
      addToast('Failed to add category', 'error')
    }
  }

  const handleAddGroup = async () => {
    if (!addGroupName.trim()) return
    await addGroup(addGroupName.trim())
    setAddGroupName('')
    setShowAddGroup(false)
    addToast('Group added', 'success')
  }

  const handleDeleteGroup = async (id: string) => {
    await deleteGroup(id)
    addToast('Group deleted', 'info')
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
    addToast('Category deleted', 'info')
  }

  const spendingData = summary?.spending_by_category ?? []
  const totalSpending = Math.abs(summary?.total_spending ?? 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Two-column body: budget table (2/3) + charts (1/3) */}
      <div className="grid grid-cols-3 gap-6 items-start">

        {/* LEFT: budget table */}
        <div className="col-span-2 space-y-0">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <div className="w-52 flex-shrink-0">Category</div>
            <div className="w-28 flex-shrink-0 text-right">Assigned</div>
            <div className="w-28 flex-shrink-0 text-right">Activity</div>
            <div className="w-32 flex-shrink-0 text-right">Available</div>
          </div>

          {/* Category groups */}
          {budgetLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-lg border border-border-light dark:border-border-dark h-12 bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-0">
              {groups.map(group => (
                <CategoryGroup
                  key={group.id}
                  group={group}
                  categories={group.categories}
                  spendingData={spendingData}
                  onToggle={toggleGroup}
                  onEditBudget={updateBudget}
                  onOpenModal={setSelectedCategoryId}
                  onAddCategory={handleAddCategory}
                  onDeleteGroup={handleDeleteGroup}
                  onRenameGroup={renameGroup}
                />
              ))}
            </div>
          )}

          {/* Add group */}
          <div className="pt-1">
            {showAddGroup ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={addGroupName}
                  onChange={e => setAddGroupName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddGroup()
                    if (e.key === 'Escape') setShowAddGroup(false)
                  }}
                  placeholder="Group name..."
                  className="flex-1 rounded-md border border-border-light dark:border-border-dark bg-surface dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
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
        </div>

        {/* RIGHT: charts panel */}
        <div className="col-span-1 sticky top-6">
          <PlanCharts
            groups={groups}
            spendingData={spendingData}
            totalSpending={totalSpending}
            loading={loading || budgetLoading}
          />
        </div>
      </div>

      {/* Category modal */}
      <CategoryModal
        category={selectedCategory}
        groups={groups}
        open={!!selectedCategoryId}
        onClose={() => setSelectedCategoryId(null)}
        onSave={(id, changes) => {
          updateCategory(id, changes as Partial<BudgetCategory>)
          addToast('Category saved', 'success')
        }}
        onDelete={id => {
          deleteCategory(id)
          addToast('Category deleted', 'info')
        }}
      />
    </div>
  )
}
