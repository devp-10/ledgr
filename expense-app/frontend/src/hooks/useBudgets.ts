import { useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'
import { BudgetGroup, BudgetCategory, BudgetRule } from '../types'

export function useBudgets() {
  const [groups, setGroups] = useState<BudgetGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const data = await api.getBudget()
      setGroups(data.groups)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load budget')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const toggleGroup = useCallback(async (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    // Optimistic update
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g))
    try {
      await api.updateGroup(groupId, { collapsed: !group.collapsed })
    } catch {
      // Revert on failure
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, collapsed: group.collapsed } : g))
    }
  }, [groups])

  const updateBudget = useCallback(async (categoryId: string, amount: number) => {
    // Optimistic update
    setGroups(prev => prev.map(g => ({
      ...g,
      categories: g.categories.map(c => c.id === categoryId ? { ...c, budget_amount: amount } : c),
    })))
    try {
      await api.updateCategory(categoryId, { budget_amount: amount })
    } catch {
      reload()
    }
  }, [reload])

  const addCategory = useCallback(async (groupId: string): Promise<BudgetCategory | null> => {
    try {
      const cat = await api.createCategory({
        name: 'New Category',
        group_id: groupId,
        budget_amount: 0,
        emoji: '📦',
      })
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, categories: [...g.categories, cat] } : g
      ))
      return cat
    } catch {
      return null
    }
  }, [])

  const updateCategory = useCallback(async (id: string, changes: Partial<{
    name: string; group_id: string; budget_amount: number; emoji: string; rules: BudgetRule[]
  }>) => {
    try {
      const updated = await api.updateCategory(id, changes)
      if (changes.group_id) {
        // Group changed — reload to correctly move category
        await reload()
      } else {
        setGroups(prev => prev.map(g => ({
          ...g,
          categories: g.categories.map(c => c.id === id ? updated : c),
        })))
      }
    } catch {
      reload()
    }
  }, [reload])

  const deleteCategory = useCallback(async (id: string) => {
    setGroups(prev => prev.map(g => ({
      ...g,
      categories: g.categories.filter(c => c.id !== id),
    })))
    try {
      await api.deleteCategory(id)
    } catch {
      reload()
    }
  }, [reload])

  const addGroup = useCallback(async (name: string) => {
    try {
      const group = await api.createGroup(name)
      setGroups(prev => [...prev, group])
    } catch {
      reload()
    }
  }, [reload])

  const deleteGroup = useCallback(async (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id))
    try {
      await api.deleteGroup(id)
    } catch {
      reload()
    }
  }, [reload])

  return {
    groups,
    loading,
    error,
    reload,
    toggleGroup,
    updateBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addGroup,
    deleteGroup,
  }
}
