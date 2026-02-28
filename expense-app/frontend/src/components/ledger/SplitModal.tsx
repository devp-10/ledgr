import { useState } from 'react'
import { Transaction, SplitItem } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { Plus, Trash2 } from 'lucide-react'

interface SplitModalProps {
  transaction: Transaction
  categories: string[]
  onSplit: (splits: SplitItem[]) => Promise<void>
  onClose: () => void
}

export function SplitModal({ transaction: t, categories, onSplit, onClose }: SplitModalProps) {
  const total = Math.abs(t.amount)
  const [splits, setSplits] = useState<SplitItem[]>([
    { amount: total / 2, description: t.description, category: t.category ?? undefined },
    { amount: total / 2, description: t.description, category: undefined },
  ])
  const [saving, setSaving] = useState(false)

  const splitTotal = splits.reduce((s, x) => s + (parseFloat(String(x.amount)) || 0), 0)
  const remaining = Math.round((total - splitTotal) * 100) / 100

  const update = (i: number, field: keyof SplitItem, value: string | number) => {
    setSplits(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const addSplit = () => {
    setSplits(prev => [...prev, { amount: 0, description: t.description, category: undefined }])
  }

  const removeSplit = (i: number) => {
    if (splits.length <= 2) return
    setSplits(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    const valid = splits.filter(s => (parseFloat(String(s.amount)) || 0) > 0)
    if (!valid.length) return
    setSaving(true)
    try {
      await onSplit(valid.map(s => ({ ...s, amount: -(parseFloat(String(s.amount)) || 0) })))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Split Transaction" size="md">
      <div className="p-5 space-y-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Splitting <span className="font-semibold text-gray-800 dark:text-gray-200">{t.description}</span> — total{' '}
          <span className="font-money font-semibold">${total.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          {splits.map((s, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/50">
              <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                <input
                  value={s.description}
                  onChange={e => update(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="text-sm px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500"
                />
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={s.amount}
                    onChange={e => update(i, 'amount', e.target.value)}
                    className="w-full text-sm pl-6 pr-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    value={s.category ?? ''}
                    onChange={v => update(i, 'category', v)}
                    options={[
                      { value: '', label: 'No category' },
                      ...categories.map(c => ({ value: c, label: c })),
                    ]}
                    searchable
                    className="py-1.5 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => removeSplit(i)}
                disabled={splits.length <= 2}
                className="p-1 rounded text-gray-400 hover:text-red-500 disabled:opacity-30 flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addSplit}
          className="flex items-center gap-1.5 text-xs text-accent-500 hover:text-accent-600 transition-colors"
        >
          <Plus size={13} /> Add split
        </button>

        {Math.abs(remaining) > 0.01 && (
          <p className={`text-xs font-medium ${remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
            {remaining > 0 ? `$${remaining.toFixed(2)} remaining` : `$${Math.abs(remaining).toFixed(2)} over total`}
          </p>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-border-light dark:border-border-dark">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} disabled={Math.abs(remaining) > 0.01} onClick={handleSave}>
            Split Transaction
          </Button>
        </div>
      </div>
    </Modal>
  )
}
