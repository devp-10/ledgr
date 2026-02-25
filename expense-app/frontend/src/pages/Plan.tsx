import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { DashboardSummary, BudgetCategory, Account } from '../types'
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
  } = useBudgets()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [addAccountName, setAddAccountName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    api.getDashboard(month)
      .then(setSummary)
      .catch(() => addToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false))
  }, [month]) // eslint-disable-line

  useEffect(() => {
    api.getAccounts()
      .then(setAccounts)
      .catch(() => addToast('Failed to load accounts', 'error'))
  }, []) // eslint-disable-line

  const allCategories = groups.flatMap(g => g.categories)
  const totalBudgeted = allCategories.reduce((sum, c) => sum + c.budget_amount, 0)
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

  const handleAddAccount = async () => {
    if (!addAccountName.trim()) return
    try {
      const account = await api.addAccount(addAccountName.trim())
      setAccounts(prev => [...prev, account].sort((a, b) => a.name.localeCompare(b.name)))
      setAddAccountName('')
      setShowAddAccount(false)
      addToast('Account added', 'success')
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to add account', 'error')
    }
  }

  const handleDeleteAccount = async (id: number) => {
    try {
      await api.deleteAccount(id)
      setAccounts(prev => prev.filter(a => a.id !== id))
      setConfirmDeleteId(null)
      addToast('Account removed', 'info')
    } catch {
      addToast('Failed to remove account', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Monthly overview */}
      <MonthlyOverview
        summary={summary}
        totalBudgeted={totalBudgeted}
        loading={loading}
      />

      {/* Column headers (YNAB-style) */}
      <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        <div className="w-52 flex-shrink-0">Category</div>
        <div className="w-28 flex-shrink-0 text-right">Assigned</div>
        <div className="w-28 flex-shrink-0 text-right">Activity</div>
        <div className="flex-1 text-right">Available</div>
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
              spendingData={summary?.spending_by_category ?? []}
              onToggle={toggleGroup}
              onEditBudget={updateBudget}
              onOpenModal={setSelectedCategoryId}
              onAddCategory={handleAddCategory}
              onDeleteGroup={handleDeleteGroup}
              onDeleteCategory={handleDeleteCategory}
            />
          ))}
        </div>
      )}

      {/* Add group */}
      <div>
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

      {/* Accounts section */}
      <div className="pt-6 mt-2 border-t border-border-light dark:border-border-dark">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 mb-2">
          Accounts
        </p>

        <div className="space-y-0">
          {accounts.length === 0 && !showAddAccount && (
            <p className="text-sm text-gray-400 dark:text-gray-500 px-3 py-2">
              No accounts yet — add your banks and credit cards.
            </p>
          )}
          {accounts.map(account => (
            <div
              key={account.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg group hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{account.name}</span>
              {confirmDeleteId === account.id ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Unlinks {account.transaction_count} {account.transaction_count === 1 ? 'transaction' : 'transactions'} —
                  </span>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-status-negative hover:underline font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:hidden">
                    {account.transaction_count} {account.transaction_count === 1 ? 'transaction' : 'transactions'}
                  </span>
                  <button
                    onClick={() => {
                      if (account.transaction_count === 0) handleDeleteAccount(account.id)
                      else setConfirmDeleteId(account.id)
                    }}
                    className="hidden group-hover:flex p-1 rounded text-gray-400 hover:text-status-negative transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-1">
          {showAddAccount ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={addAccountName}
                onChange={e => setAddAccountName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddAccount()
                  if (e.key === 'Escape') { setShowAddAccount(false); setAddAccountName('') }
                }}
                placeholder="e.g. Chase Sapphire, BofA Checking..."
                className="flex-1 rounded-md border border-border-light dark:border-border-dark bg-surface dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
              />
              <Button variant="primary" size="sm" onClick={handleAddAccount}>Add</Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddAccount(false); setAddAccountName('') }}>Cancel</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setShowAddAccount(true)}>
              <Plus size={14} /> Add Account
            </Button>
          )}
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
