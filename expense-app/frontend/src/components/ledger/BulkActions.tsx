import { useState } from 'react'
import { Tag } from 'lucide-react'
import { Button } from '../ui/Button'

interface BulkActionsProps {
  count: number
  categories: string[]
  onCategorize: (category: string) => Promise<void>
  onDeselect: () => void
}

export function BulkActions({ count, categories, onCategorize, onDeselect }: BulkActionsProps) {
  const [selectedCat, setSelectedCat] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCategorize = async () => {
    if (!selectedCat) return
    setLoading(true)
    try {
      await onCategorize(selectedCat)
      setSelectedCat('')
    } finally {
      setLoading(false)
    }
  }

  if (!count) return null

  return (
    <div className="flex items-center gap-3 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800/50 rounded-lg px-4 py-2.5 animate-fade-in">
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
        <Button variant="primary" size="sm" loading={loading} disabled={!selectedCat} onClick={handleCategorize}>
          Apply
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onDeselect}>
        Deselect all
      </Button>
    </div>
  )
}
