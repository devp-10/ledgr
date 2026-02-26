import { useState, useEffect } from 'react'
import { Trash2, Plus, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { BudgetCategory, BudgetGroup, BudgetRule } from '../../types'

interface CategoryModalProps {
  category: BudgetCategory | null
  groups: BudgetGroup[]
  open: boolean
  onClose: () => void
  onSave: (id: string, changes: Partial<BudgetCategory>) => void
  onDelete: (id: string) => void
}

const MATCH_TYPES: BudgetRule['match_type'][] = ['contains', 'starts_with', 'ends_with', 'regex']

export function CategoryModal({ category, groups, open, onClose, onSave, onDelete }: CategoryModalProps) {
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('0')
  const [group, setGroup] = useState('')
  const [emoji, setEmoji] = useState('')
  const [rules, setRules] = useState<BudgetRule[]>([])
  const [newRule, setNewRule] = useState({ match_type: 'contains' as BudgetRule['match_type'], pattern: '' })
  const [testInput, setTestInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setBudget(String(category.budget_amount))
      setGroup(category.group_id)
      setEmoji(category.emoji ?? '')
      setRules(category.rules ?? [])
      setTestInput('')
      setNewRule({ match_type: 'contains', pattern: '' })
    }
  }, [category])

  if (!category) return null

  const testMatch = () => {
    if (!newRule.pattern || !testInput) return null
    try {
      if (newRule.match_type === 'contains') return testInput.toLowerCase().includes(newRule.pattern.toLowerCase())
      if (newRule.match_type === 'starts_with') return testInput.toLowerCase().startsWith(newRule.pattern.toLowerCase())
      if (newRule.match_type === 'ends_with') return testInput.toLowerCase().endsWith(newRule.pattern.toLowerCase())
      if (newRule.match_type === 'regex') return new RegExp(newRule.pattern, 'i').test(testInput)
    } catch { return false }
    return false
  }

  const matched = testInput ? testMatch() : null

  const handleSave = () => {
    onSave(category.id, {
      name: name.trim(),
      budget_amount: parseFloat(budget.replace(/[^0-9.]/g, '')) || 0,
      group_id: group,
      emoji: emoji.trim(),
      rules,
    })
    onClose()
  }

  const addRule = () => {
    if (!newRule.pattern.trim()) return
    setRules(prev => [...prev, { id: Date.now().toString(), ...newRule, category_id: category.id }])
    setNewRule({ match_type: 'contains', pattern: '' })
  }

  const removeRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id))

  return (
    <Modal open={open} onClose={onClose} title="Edit Category" size="lg">
      <div className="p-6 space-y-5">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="w-16">
              <Input label="Emoji" value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🏠" />
            </div>
            <div className="flex-1">
              <Input label="Category name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          <Input
            label="Monthly budget"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            prefix={<span className="text-xs">$</span>}
            type="number"
            min="0"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Group</label>
          <select
            value={group}
            onChange={e => setGroup(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {/* Auto-categorization rules */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Auto-Categorization Rules
          </h4>

          {/* Existing rules */}
          <div className="space-y-2 mb-3">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm">
                <span className="text-gray-500 dark:text-gray-400 text-xs">{rule.match_type}</span>
                <span className="flex-1 font-mono text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                  {rule.pattern}
                </span>
                <button onClick={() => removeRule(rule.id)} className="text-gray-400 hover:text-danger-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* New rule editor */}
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <select
                value={newRule.match_type}
                onChange={e => setNewRule(r => ({ ...r, match_type: e.target.value as BudgetRule['match_type'] }))}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {MATCH_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <input
                value={newRule.pattern}
                onChange={e => setNewRule(r => ({ ...r, pattern: e.target.value }))}
                placeholder="Pattern (e.g. WHOLE FOODS)"
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-gray-400"
              />
              <Button size="sm" variant="secondary" onClick={addRule}><Plus size={14} />Add</Button>
            </div>

            {/* Test input */}
            <div className="flex items-center gap-2">
              <input
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder='Test: "UBER EATS DELIVERY"'
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 placeholder:text-gray-400"
              />
              {matched !== null && (
                <span className={`text-xs font-medium px-2 py-1 rounded-lg ${matched ? 'bg-success-500/10 text-success-600 dark:text-success-400' : 'bg-danger-500/10 text-danger-500'}`}>
                  {matched ? '✓ Matches' : '✗ No match'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Delete this category?</span>
              <Button variant="danger" size="sm" onClick={() => { onDelete(category.id); onClose() }}>
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          )}
          {!confirmDelete && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>Save Changes</Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
