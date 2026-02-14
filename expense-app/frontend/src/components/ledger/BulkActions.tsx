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
    <div className="flex items-center gap-3 glass border-primary-500/30 rounded-xl px-4 py-2.5 animate-fade-in" style={{ borderColor: 'rgba(124,58,237,0.3)' }}>
      <span className="text-sm font-medium text-primary-400">
        {count} selected
      </span>

      <div className="flex items-center gap-2 flex-1">
        <Tag size={14} className="text-primary-400 flex-shrink-0" />
        <select
          value={selectedCat}
          onChange={e => setSelectedCat(e.target.value)}
          className="input-dark flex-1 max-w-[180px] text-sm px-2 py-1.5"
        >
          <option value="">Set category...</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button
          variant="primary"
          size="sm"
          loading={loading}
          disabled={!selectedCat}
          onClick={handleCategorize}
        >
          Apply
        </Button>
      </div>

      <Button variant="ghost" size="sm" onClick={onDeselect}>
        Deselect all
      </Button>
    </div>
  )
}
