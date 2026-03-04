import { useState, useCallback, useEffect, useRef } from 'react'
import { api, Transaction, TransactionFilters, TransactionUpdate, PaginatedTransactions } from '../lib/api'

export function useTransactions(initialFilters: TransactionFilters = {}) {
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, page_size: 50, ...initialFilters })
  const [data, setData] = useState<PaginatedTransactions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  // Prevents concurrent loadMore calls
  const loadingMoreRef = useRef(false)

  const load = useCallback(async (f?: TransactionFilters) => {
    const current = f ?? filtersRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await api.getTransactions(current)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateFilters = useCallback((updates: Partial<TransactionFilters>) => {
    setFilters(prev => {
      const next = { ...prev, ...updates, page: 1 }
      load(next)
      return next
    })
  }, [load])

  // Appends the next page of results (infinite scroll)
  const loadMore = useCallback(async () => {
    if (!data || loadingMoreRef.current || data.page >= data.total_pages) return
    loadingMoreRef.current = true
    const nextPage = data.page + 1
    const nextFilters = { ...filtersRef.current, page: nextPage }
    setFilters(prev => ({ ...prev, page: nextPage }))
    setLoading(true)
    try {
      const result = await api.getTransactions(nextFilters)
      setData(prev => prev ? {
        ...result,
        items: [...prev.items, ...result.items],
      } : result)
    } catch {
      // silently ignore load-more errors
    } finally {
      setLoading(false)
      loadingMoreRef.current = false
    }
  }, [data])

  const patchTransaction = useCallback(async (id: number, update: Partial<TransactionUpdate>): Promise<Transaction> => {
    const updated = await api.updateTransaction(id, update)
    setData(prev => prev ? {
      ...prev,
      items: prev.items.map(t => t.id === id ? updated : t),
    } : prev)
    return updated
  }, [])

  const removeTransaction = useCallback((id: number) => {
    setData(prev => prev ? {
      ...prev,
      items: prev.items.filter(t => t.id !== id),
      total: prev.total - 1,
    } : prev)
  }, [])

  const bulkUpdate = useCallback(async (ids: number[], category: string) => {
    await api.bulkUpdateTransactions(ids, category)
    await load()
  }, [load])

  const bulkReview = useCallback(async (ids: number[]) => {
    await api.bulkReviewTransactions(ids)
    await load()
  }, [load])

  const bulkDelete = useCallback(async (ids: number[]) => {
    await api.bulkDeleteTransactions(ids)
    await load()
  }, [load])

  return {
    transactions: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.total_pages ?? 0,
    page: filters.page ?? 1,
    hasMore: data ? data.page < data.total_pages : false,
    loading,
    error,
    filters,
    updateFilters,
    loadMore,
    patchTransaction,
    removeTransaction,
    bulkUpdate,
    bulkReview,
    bulkDelete,
    refetch: load,
  }
}
