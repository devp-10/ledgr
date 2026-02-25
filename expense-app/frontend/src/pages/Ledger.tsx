import { useState, useCallback, useEffect } from 'react'
import { Upload } from 'lucide-react'
import { format, startOfMonth, subDays, subMonths, startOfYear } from 'date-fns'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { SearchBar } from '../components/ledger/SearchBar'
import { QuickFilters } from '../components/ledger/QuickFilters'
import { AdvancedFilters } from '../components/ledger/AdvancedFilters'
import { TransactionList } from '../components/ledger/TransactionList'
import { BulkActions } from '../components/ledger/BulkActions'
import { ImportModal } from '../components/ledger/ImportModal'
import { Button } from '../components/ui/Button'
import { QuickFilter, Account } from '../types'
import { api } from '../lib/api'
import { useToastContext } from '../App'

function getDateRange(filter: QuickFilter): { date_from?: string; date_to?: string } {
  const today = new Date()
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd')
  switch (filter) {
    case 'this-month': return { date_from: fmt(startOfMonth(today)), date_to: fmt(today) }
    case 'last-30': return { date_from: fmt(subDays(today, 30)), date_to: fmt(today) }
    case 'last-90': return { date_from: fmt(subDays(today, 90)), date_to: fmt(today) }
    case 'this-year': return { date_from: fmt(startOfYear(today)), date_to: fmt(today) }
    case 'all-time': return {}
  }
}

export function Ledger() {
  const addToast = useToastContext()
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('this-month')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [importOpen, setImportOpen] = useState(false)

  const { transactions, total, loading, filters, updateFilters, updateTransaction, bulkUpdate, refetch } = useTransactions({
    ...getDateRange('this-month'),
    page_size: 100,
  })

  const { categories } = useCategories()
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch(() => {})
  }, []) // eslint-disable-line

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => updateFilters({ search: search || undefined }), 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const handleQuickFilter = (f: QuickFilter) => {
    setQuickFilter(f)
    updateFilters(getDateRange(f))
  }

  const handleSelect = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? new Set(transactions.map(t => t.id)) : new Set())
  }, [transactions])

  const handleCategoryChange = useCallback(async (id: number, category: string) => {
    try {
      await updateTransaction(id, category)
      addToast(`Category updated to ${category}`, 'success')
    } catch {
      addToast('Failed to update category', 'error')
    }
  }, [updateTransaction, addToast])

  const handleBulkCategorize = useCallback(async (category: string) => {
    try {
      await bulkUpdate([...selectedIds], category)
      setSelectedIds(new Set())
      addToast(`Updated ${selectedIds.size} transactions to ${category}`, 'success')
    } catch {
      addToast('Bulk update failed', 'error')
    }
  }, [selectedIds, bulkUpdate, addToast])

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search + Import */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setImportOpen(true)}
        >
          <Upload size={15} /> Import
        </Button>
      </div>

      {/* Quick filters */}
      <QuickFilters active={quickFilter} onChange={handleQuickFilter} />

      {/* Advanced filters */}
      <AdvancedFilters
        filters={filters}
        categories={categories}
        accounts={accounts}
        onUpdate={updateFilters}
      />

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <BulkActions
          count={selectedIds.size}
          categories={categories}
          onCategorize={handleBulkCategorize}
          onDeselect={() => setSelectedIds(new Set())}
        />
      )}

      {/* Transaction list */}
      <TransactionList
        transactions={transactions}
        categories={categories}
        selectedIds={selectedIds}
        onSelectAll={handleSelectAll}
        onSelect={handleSelect}
        onCategoryChange={handleCategoryChange}
        loading={loading}
        total={total}
      />

      {/* Import modal */}
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onComplete={() => { refetch(); addToast('Import complete!', 'success') }}
      />
    </div>
  )
}
