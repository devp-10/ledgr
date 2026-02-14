import { useState, useCallback } from 'react'
import { BudgetState, BudgetGroup, BudgetCategory } from '../types'

const STORAGE_KEY = 'ledgr_budget_v1'

const DEFAULT_GROUPS: BudgetGroup[] = [
  { id: 'bills', name: 'Bills & Utilities', collapsed: false },
  { id: 'lifestyle', name: 'Lifestyle', collapsed: false },
  { id: 'transport', name: 'Transportation', collapsed: false },
  { id: 'health', name: 'Health & Wellness', collapsed: true },
  { id: 'subscriptions', name: 'Subscriptions', collapsed: true },
  { id: 'shopping', name: 'Shopping', collapsed: true },
  { id: 'savings', name: 'Savings & Goals', collapsed: true },
]

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: 'rent', name: 'Housing', group: 'bills', budgetAmount: 1500, emoji: '🏠' },
  { id: 'utilities', name: 'Utilities', group: 'bills', budgetAmount: 150, emoji: '⚡' },
  { id: 'internet', name: 'Subscriptions', group: 'bills', budgetAmount: 100, emoji: '📡' },
  { id: 'groceries', name: 'Groceries', group: 'lifestyle', budgetAmount: 500, emoji: '🛒' },
  { id: 'dining', name: 'Dining & Restaurants', group: 'lifestyle', budgetAmount: 200, emoji: '🍽️' },
  { id: 'entertainment', name: 'Entertainment', group: 'lifestyle', budgetAmount: 100, emoji: '🎬' },
  { id: 'transport', name: 'Transportation', group: 'transport', budgetAmount: 200, emoji: '🚗' },
  { id: 'healthcare', name: 'Healthcare', group: 'health', budgetAmount: 150, emoji: '❤️' },
  { id: 'shopping', name: 'Shopping', group: 'shopping', budgetAmount: 300, emoji: '🛍️' },
]

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { groups: DEFAULT_GROUPS, categories: DEFAULT_CATEGORIES, version: 1 }
}

function saveState(state: BudgetState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useBudgets() {
  const [state, setState] = useState<BudgetState>(loadState)

  const update = useCallback((updater: (s: BudgetState) => BudgetState) => {
    setState(prev => {
      const next = updater(prev)
      saveState(next)
      return next
    })
  }, [])

  const toggleGroup = useCallback((groupId: string) => {
    update(s => ({
      ...s,
      groups: s.groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g),
    }))
  }, [update])

  const updateBudget = useCallback((categoryId: string, amount: number) => {
    update(s => ({
      ...s,
      categories: s.categories.map(c => c.id === categoryId ? { ...c, budgetAmount: amount } : c),
    }))
  }, [update])

  const addCategory = useCallback((cat: BudgetCategory) => {
    update(s => ({ ...s, categories: [...s.categories, cat] }))
  }, [update])

  const updateCategory = useCallback((id: string, changes: Partial<BudgetCategory>) => {
    update(s => ({
      ...s,
      categories: s.categories.map(c => c.id === id ? { ...c, ...changes } : c),
    }))
  }, [update])

  const deleteCategory = useCallback((id: string) => {
    update(s => ({ ...s, categories: s.categories.filter(c => c.id !== id) }))
  }, [update])

  const addGroup = useCallback((name: string) => {
    const id = name.toLowerCase().replace(/\s+/g, '-')
    update(s => ({ ...s, groups: [...s.groups, { id, name, collapsed: false }] }))
  }, [update])

  return {
    groups: state.groups,
    categories: state.categories,
    toggleGroup,
    updateBudget,
    addCategory,
    updateCategory,
    deleteCategory,
    addGroup,
  }
}
