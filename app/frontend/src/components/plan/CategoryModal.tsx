import { useState, useEffect } from 'react'
import { Trash2, Plus, X } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
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
  const [regexError, setRegexError] = useState('')

  useEffect(() => {
    if (category) {
      setName(category.name)
      setBudget(String(category.budget_amount))
      setGroup(category.group_id)
      setEmoji(category.emoji ?? '')
      setRules(category.rules ?? [])
      setTestInput('')
      setNewRule({ match_type: 'contains', pattern: '' })
      setRegexError('')
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
    if (newRule.match_type === 'regex') {
      try {
        new RegExp(newRule.pattern)
      } catch (e) {
        setRegexError('Invalid regex: ' + (e as Error).message)
        return
      }
    }
    setRegexError('')
    setRules(prev => [...prev, { id: Date.now().toString(), ...newRule, category_id: category.id }])
    setNewRule({ match_type: 'contains', pattern: '' })
  }

  const removeRule = (id: string) => setRules(prev => prev.filter(r => r.id !== id))

  const handlePatternChange = (pattern: string) => {
    setNewRule(r => ({ ...r, pattern }))
    if (regexError) setRegexError('')
  }

  const handleMatchTypeChange = (match_type: BudgetRule['match_type']) => {
    setNewRule(r => ({ ...r, match_type }))
    if (regexError) setRegexError('')
  }

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
          <Select
            value={group}
            onChange={setGroup}
            options={groups.map(g => ({ value: g.id, label: g.name }))}
          />
        </div>

        {/* Auto-categorization rules */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Auto-Categorization Rules
          </h4>

          {/* Existing rules — fixed-height scrollable box */}
          <div className="max-h-36 overflow-y-auto space-y-1.5 mb-3 rounded-lg border border-gray-100 dark:border-gray-700/50 p-1.5 bg-gray-50/50 dark:bg-gray-800/30">
            {rules.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No rules yet</p>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 p-2 rounded-md bg-white dark:bg-gray-700/60 text-sm border border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 text-xs shrink-0">{rule.match_type}</span>
                  <span className="flex-1 font-mono text-xs text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 truncate">
                    {rule.pattern}
                  </span>
                  <button onClick={() => removeRule(rule.id)} className="shrink-0 text-gray-400 hover:text-danger-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* New rule editor */}
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <div className="w-36 flex-shrink-0">
                <Select
                  value={newRule.match_type}
                  onChange={v => handleMatchTypeChange(v as BudgetRule['match_type'])}
                  options={MATCH_TYPES.map(t => ({ value: t, label: t.replace('_', ' ') }))}
                  className="py-2 text-xs"
                />
              </div>
              <input
                value={newRule.pattern}
                onChange={e => handlePatternChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addRule() }}
                placeholder="Pattern (e.g. WHOLE FOODS)"
                className={`flex-1 rounded-lg border bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 placeholder:text-gray-400 ${
                  regexError
                    ? 'border-danger-500 focus:ring-danger-500/20'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/20 focus:border-primary-500'
                }`}
              />
              <Button size="sm" variant="secondary" onClick={addRule}><Plus size={14} />Add</Button>
            </div>
            {regexError && (
              <p className="text-xs text-danger-500 dark:text-danger-400">{regexError}</p>
            )}

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
