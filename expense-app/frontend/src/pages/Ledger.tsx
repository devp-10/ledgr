import { useState, useCallback, useEffect } from 'react'
import { Upload, Plus } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from 'date-fns'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { SearchBar } from '../components/ledger/SearchBar'
import { QuickFilters } from '../components/ledger/QuickFilters'
import { AdvancedFilters } from '../components/ledger/AdvancedFilters'
import { TransactionList } from '../components/ledger/TransactionList'
import { ToReviewList } from '../components/ledger/ToReviewList'
import { BulkActions } from '../components/ledger/BulkActions'
import { ImportModal } from '../components/ledger/ImportModal'
import { AddTransactionModal } from '../components/ledger/AddTransactionModal'
import { Button } from '../components/ui/Button'
import { QuickFilter, LedgerView, Account, TransactionUpdate } from '../types'
import { api } from '../lib/api'
import { useToastContext } from '../App'
import { clsx } from 'clsx'

function getDateRange(filter: QuickFilter): { date_from?: string; date_to?: string } {
  const today = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (filter) {
    case 'this-month':
      return { date_from: fmt(startOfMonth(today)), date_to: fmt(endOfMonth(today)) }
    case 'last-month': {
      const lm = subMonths(today, 1)
      return { date_from: fmt(startOfMonth(lm)), date_to: fmt(endOfMonth(lm)) }
    }
    case 'this-year':
      return { date_from: fmt(startOfYear(today)), date_to: fmt(endOfYear(today)) }
    case 'last-year': {
      const ly = subYears(today, 1)
      return { date_from: fmt(startOfYear(ly)), date_to: fmt(endOfYear(ly)) }
    }
    case 'all-time':
      return {}
  }
}

export function Ledger() {
  const addToast = useToastContext()
  const [view, setView] = useState<LedgerView>('all')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('this-month')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])

  const { categories } = useCategories()

  // All Transactions hook
  const allTx = useTransactions({
    ...getDateRange('this-month'),
    reviewed: 1,
    sort_by: 'date',
    sort_dir: 'desc',
    page_size: 200,
  })

  // To Review hook — always shows unreviewed, no date filter
  const reviewTx = useTransactions({
    reviewed: 0,
    page_size: 200,
  })

  const active = view === 'all' ? allTx : reviewTx

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch(() => {})
  }, [])

  // Debounced search (only for All Transactions)
  useEffect(() => {
    if (view !== 'all') return
    const t = setTimeout(() => allTx.updateFilters({ search: search || undefined }), 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleQuickFilter = (f: QuickFilter) => {
    setQuickFilter(f)
    allTx.updateFilters(getDateRange(f))
  }

  const handleSort = (col: string) => {
    const newDir = sortBy === col && sortDir === 'desc' ? 'asc' : 'desc'
    setSortBy(col)
    setSortDir(newDir)
    allTx.updateFilters({ sort_by: col, sort_dir: newDir })
  }

  const handleSelect = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(active.transactions.map(t => t.id)) : new Set())
  }, [active.transactions])

  const handlePatch = useCallback(async (id: number, update: Partial<TransactionUpdate>) => {
    try {
      await active.patchTransaction(id, update)
    } catch {
      addToast('Failed to update transaction', 'error')
    }
  }, [active, addToast])

  const handleDelete = useCallback(async (id: number) => {
    try {
      await api.deleteTransaction(id)
      active.removeTransaction(id)
      addToast('Transaction deleted', 'success')
    } catch {
      addToast('Failed to delete transaction', 'error')
    }
  }, [active, addToast])

  const handleReview = useCallback(async (id: number, update: Partial<TransactionUpdate>) => {
    try {
      await reviewTx.patchTransaction(id, { ...update, reviewed: true })
      reviewTx.removeTransaction(id)
      await allTx.refetch()
      addToast('Transaction marked as reviewed', 'success')
    } catch {
      addToast('Failed to review transaction', 'error')
    }
  }, [reviewTx, allTx, addToast])

  const handleBulkCategorize = useCallback(async (category: string) => {
    try {
      await active.bulkUpdate([...selectedIds], category)
      setSelectedIds(new Set())
      addToast(`Updated ${selectedIds.size} transactions`, 'success')
    } catch {
      addToast('Bulk update failed', 'error')
    }
  }, [selectedIds, active, addToast])

  const handleBulkReview = useCallback(async () => {
    try {
      await reviewTx.bulkReview([...selectedIds])
      setSelectedIds(new Set())
      await allTx.refetch()
      addToast(`${selectedIds.size} transactions marked as reviewed`, 'success')
    } catch {
      addToast('Bulk review failed', 'error')
    }
  }, [selectedIds, reviewTx, allTx, addToast])

  const handleBulkDelete = useCallback(async () => {
    try {
      await active.bulkDelete([...selectedIds])
      setSelectedIds(new Set())
      addToast(`Deleted ${selectedIds.size} transactions`, 'success')
    } catch {
      addToast('Bulk delete failed', 'error')
    }
  }, [selectedIds, active, addToast])

  const handleBulkAICategorize = useCallback(async () => {
    const ids = [...selectedIds]
    try {
      const result = await api.bulkCategorizeAI(ids)
      if (result.job_id) {
        // Poll until categorization completes
        await new Promise<void>(resolve => {
          const poll = setInterval(async () => {
            try {
              const status = await api.getCategorizationStatus(result.job_id!)
              if (status.status === 'complete' || status.status.startsWith('error')) {
                clearInterval(poll)
                resolve()
              }
            } catch {
              clearInterval(poll)
              resolve()
            }
          }, 1000)
        })
      }
      await allTx.refetch()
      setSelectedIds(new Set())
      addToast(`AI categorized ${result.total} transaction${result.total !== 1 ? 's' : ''}`, 'success')
    } catch {
      addToast('AI categorization failed', 'error')
    }
  }, [selectedIds, allTx, addToast])

  const handleAdd = useCallback(async (req: Parameters<typeof api.createTransaction>[0]) => {
    try {
      await api.createTransaction(req)
      await allTx.refetch()
      addToast('Transaction added', 'success')
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to add transaction', 'error')
      throw e
    }
  }, [allTx, addToast])

  const switchView = (v: LedgerView) => {
    setView(v)
    setSelectedIds(new Set())
  }

  const reviewCount = reviewTx.total

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top bar: Tabs + actions */}
      <div className="flex items-center gap-3">
        {/* View tabs */}
        <div className="flex rounded-lg border border-border-light dark:border-border-dark overflow-hidden flex-shrink-0">
          <button
            onClick={() => switchView('all')}
            className={clsx(
              'px-4 py-2 text-sm font-medium transition-colors',
              view === 'all'
                ? 'bg-accent-500 text-white'
                : 'bg-surface dark:bg-[#171717] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
            )}
          >
            All Transactions
          </button>
          <button
            onClick={() => switchView('review')}
            className={clsx(
              'px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2',
              view === 'review'
                ? 'bg-accent-500 text-white'
                : 'bg-surface dark:bg-[#171717] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
            )}
          >
            To Review
            {reviewCount > 0 && (
              <span className={clsx(
                'text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center',
                view === 'review' ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
              )}>
                {reviewCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1" />

        {/* Add + Import */}
        <Button variant="ghost" size="md" onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add
        </Button>
        <Button variant="primary" size="md" onClick={() => setImportOpen(true)}>
          <Upload size={15} /> Import
        </Button>
      </div>

      {/* All Transactions filters */}
      {view === 'all' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} />
            </div>
          </div>
          <QuickFilters active={quickFilter} onChange={handleQuickFilter} />
          <AdvancedFilters
            filters={allTx.filters}
            categories={categories}
            accounts={accounts}
            onUpdate={allTx.updateFilters}
          />
        </>
      )}

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <BulkActions
          count={selectedIds.size}
          categories={categories}
          showReview={view === 'review'}
          onCategorize={handleBulkCategorize}
          onReview={view === 'review' ? handleBulkReview : undefined}
          onDelete={handleBulkDelete}
          onAICategorize={view === 'all' ? handleBulkAICategorize : undefined}
          onDeselect={() => setSelectedIds(new Set())}
        />
      )}

      {/* All Transactions view */}
      {view === 'all' && (
        <TransactionList
          transactions={allTx.transactions}
          categories={categories}
          accounts={accounts}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelect={handleSelect}
          onPatch={handlePatch}
          onDelete={handleDelete}
          loading={allTx.loading}
          total={allTx.total}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
        />
      )}

      {/* To Review view */}
      {view === 'review' && (
        <ToReviewList
          transactions={reviewTx.transactions}
          categories={categories}
          accounts={accounts}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelect={handleSelect}
          onReview={handleReview}
          onDelete={handleDelete}
          loading={reviewTx.loading}
        />
      )}

      {/* Modals */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onComplete={() => {
          reviewTx.refetch()
          allTx.refetch()
          addToast('Import complete! Review your transactions.', 'success')
          switchView('review')
        }}
      />

      <AddTransactionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
        accounts={accounts}
        onAdd={handleAdd}
      />
    </div>
  )
}
