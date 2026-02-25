import { useState } from 'react'
import { Tag, Trash2, CheckCheck } from 'lucide-react'
import { Button } from '../ui/Button'

interface BulkActionsProps {
  count: number
  categories: string[]
  showReview?: boolean
  onCategorize: (category: string) => Promise<void>
  onReview?: () => Promise<void>
  onDelete: () => Promise<void>
  onDeselect: () => void
}

export function BulkActions({ count, categories, showReview, onCategorize, onReview, onDelete, onDeselect }: BulkActionsProps) {
  const [selectedCat, setSelectedCat] = useState('')
  const [loadingCat, setLoadingCat] = useState(false)
  const [loadingReview, setLoadingReview] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const handleCategorize = async () => {
    if (!selectedCat) return
    setLoadingCat(true)
    try { await onCategorize(selectedCat); setSelectedCat('') }
    finally { setLoadingCat(false) }
  }

  const handleReview = async () => {
    if (!onReview) return
    setLoadingReview(true)
    try { await onReview() }
    finally { setLoadingReview(false) }
  }

  const handleDelete = async () => {
    setLoadingDelete(true)
    try { await onDelete() }
    finally { setLoadingDelete(false) }
  }

  if (!count) return null

  return (
    <div className="flex items-center gap-3 flex-wrap bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/50 rounded-lg px-4 py-2.5 animate-fade-in">
      <span className="text-sm font-medium text-accent-700 dark:text-accent-300">
        {count} selected
      </span>

      <div className="flex items-center gap-2 flex-1">
        <Tag size={14} className="text-accent-500 flex-shrink-0" />
        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          className="flex-1 max-w-[180px] rounded-md border border-accent-200 dark:border-accent-800 bg-surface dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        >
          <option value="">Set category...</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button variant="primary" size="sm" loading={loadingCat} disabled={!selectedCat} onClick={handleCategorize}>
          Apply
        </Button>
      </div>

      {showReview && onReview && (
        <Button variant="ghost" size="sm" loading={loadingReview} onClick={handleReview}>
          <CheckCheck size={14} /> Mark Reviewed
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        loading={loadingDelete}
        onClick={handleDelete}
        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10"
      >
        <Trash2 size={14} /> Delete
      </Button>

      <Button variant="ghost" size="sm" onClick={onDeselect}>
        Deselect all
      </Button>
    </div>
  )
}
