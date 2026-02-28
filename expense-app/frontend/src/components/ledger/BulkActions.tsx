import { useState } from 'react'
import { Tag, Trash2, CheckCheck, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

interface BulkActionsProps {
  count: number
  categories: string[]
  showReview?: boolean
  onCategorize: (category: string) => Promise<void>
  onReview?: () => Promise<void>
  onDelete: () => Promise<void>
  onAICategorize?: () => Promise<void>
  onDeselect: () => void
  aiProgress?: { completed: number; total: number }
}

export function BulkActions({
  count, categories, showReview, onCategorize, onReview, onDelete, onAICategorize, onDeselect, aiProgress
}: BulkActionsProps) {
  const [selectedCat, setSelectedCat] = useState('')
  const [loadingCat, setLoadingCat] = useState(false)
  const [loadingReview, setLoadingReview] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    try { await onDelete(); setConfirmDelete(false) }
    finally { setLoadingDelete(false) }
  }

  const handleAICategorize = async () => {
    if (!onAICategorize) return
    setLoadingAI(true)
    try { await onAICategorize() }
    finally { setLoadingAI(false) }
  }

  if (!count) return null

  const categoryOptions = [
    { value: '', label: 'Set category…' },
    ...categories.map(c => ({ value: c, label: c })),
  ]

  return (
    <div className="flex items-center gap-3 flex-wrap bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/50 rounded-lg px-4 py-2.5 animate-fade-in">
      <span className="text-sm font-medium text-accent-700 dark:text-accent-300">
        {count} selected
      </span>

      {/* Manual categorize */}
      <div className="flex items-center gap-2 flex-1">
        <Tag size={14} className="text-accent-500 flex-shrink-0" />
        <div className="flex-1 max-w-[200px]">
          <Select
            value={selectedCat}
            onChange={setSelectedCat}
            options={categoryOptions}
            searchable
            className="py-1.5 border-accent-200 dark:border-accent-800"
          />
        </div>
        <Button variant="primary" size="sm" loading={loadingCat} disabled={!selectedCat} onClick={handleCategorize}>
          Apply
        </Button>
      </div>

      {/* AI categorize */}
      {onAICategorize && (
        <Button variant="ghost" size="sm" loading={loadingAI} onClick={handleAICategorize}>
          <Sparkles size={14} />
          {loadingAI && aiProgress
            ? `Categorizing ${aiProgress.completed} of ${aiProgress.total}…`
            : 'Categorize with AI'}
        </Button>
      )}

      {/* Mark reviewed */}
      {showReview && onReview && (
        <Button variant="ghost" size="sm" loading={loadingReview} onClick={handleReview}>
          <CheckCheck size={14} /> Mark Reviewed
        </Button>
      )}

      {/* Delete with inline confirm */}
      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Delete {count} transaction{count !== 1 ? 's' : ''}?</span>
          <Button variant="danger" size="sm" loading={loadingDelete} onClick={handleDelete}>Confirm</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10"
        >
          <Trash2 size={14} /> Delete
        </Button>
      )}

      <Button variant="ghost" size="sm" onClick={onDeselect}>
        Deselect all
      </Button>
    </div>
  )
}
