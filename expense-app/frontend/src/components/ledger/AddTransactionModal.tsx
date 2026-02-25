import { useState, FormEvent } from 'react'
import { TransactionType, CreateTransactionRequest } from '../../types'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { clsx } from 'clsx'
import { format } from 'date-fns'

interface AddTransactionModalProps {
  open: boolean
  onClose: () => void
  categories: string[]
  accounts: { id: number; name: string }[]
  onAdd: (req: CreateTransactionRequest) => Promise<void>
}

export function AddTransactionModal({ open, onClose, categories, accounts, onAdd }: AddTransactionModalProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [type, setType] = useState<TransactionType>('expense')
  const [date, setDate] = useState(today)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [fromAccount, setFromAccount] = useState<number | ''>('')
  const [toAccount, setToAccount] = useState<number | ''>('')
  const [account, setAccount] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setType('expense'); setDate(today); setDesc(''); setAmount('')
    setCategory(''); setFromAccount(''); setToAccount(''); setAccount('')
    setNotes(''); setError('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const rawAmount = parseFloat(amount)
    if (!rawAmount || rawAmount <= 0) { setError('Enter a valid amount'); return }
    if (!desc.trim() && type !== 'transfer') { setError('Description is required'); return }

    setSaving(true)
    try {
      const signedAmount = type === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount)
      const resolvedCategory = type === 'expense' ? (category || undefined) : undefined
      const resolvedAccount = type === 'transfer' ? (fromAccount !== '' ? Number(fromAccount) : undefined) : (account !== '' ? Number(account) : undefined)
      const resolvedDesc = type === 'transfer' ? `Transfer${fromAccount && toAccount ? '' : ''}` || desc || 'Transfer' : desc

      await onAdd({
        date,
        description: resolvedDesc || 'Transfer',
        amount: signedAmount,
        transaction_type: type,
        category: resolvedCategory,
        account_id: resolvedAccount ?? null,
        notes,
      })

      // If transfer, also create the receiving side
      if (type === 'transfer' && toAccount !== '') {
        await onAdd({
          date,
          description: resolvedDesc || 'Transfer',
          amount: Math.abs(rawAmount),
          transaction_type: 'transfer',
          account_id: Number(toAccount),
          notes,
        })
      }

      reset()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add transaction')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full rounded-md border border-border-light dark:border-border-dark bg-surface dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500'
  const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'

  return (
    <Modal open={open} onClose={handleClose} title="Add Transaction" size="md">
      <form onSubmit={handleSave} className="p-5 space-y-4">
        {/* Type selector */}
        <div>
          <label className={labelCls}>Type</label>
          <div className="flex gap-2">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map(tp => (
              <button
                key={tp}
                type="button"
                onClick={() => { setType(tp); setCategory('') }}
                className={clsx(
                  'flex-1 py-2 rounded-md text-sm font-semibold capitalize transition-colors',
                  type === tp
                    ? 'bg-accent-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className={labelCls}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} required />
        </div>

        {/* Description (not for transfer) or Transfer description */}
        {type !== 'transfer' ? (
          <div>
            <label className={labelCls}>Description</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="e.g. Whole Foods, Netflix..."
              className={inputCls}
              required
              autoFocus
            />
          </div>
        ) : (
          <div>
            <label className={labelCls}>Description <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Transfer"
              className={inputCls}
            />
          </div>
        )}

        {/* Amount */}
        <div>
          <label className={labelCls}>Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className={inputCls + ' pl-7'}
              required
            />
          </div>
        </div>

        {/* Accounts */}
        {type === 'transfer' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>From Account</label>
              <select value={fromAccount} onChange={e => setFromAccount(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
                <option value="">Select...</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>To Account</label>
              <select value={toAccount} onChange={e => setToAccount(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
                <option value="">Select...</option>
                {accounts.filter(a => a.id !== fromAccount).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        ) : (
          accounts.length > 0 && (
            <div>
              <label className={labelCls}>Account <span className="font-normal text-gray-400">(optional)</span></label>
              <select value={account} onChange={e => setAccount(e.target.value ? Number(e.target.value) : '')} className={inputCls}>
                <option value="">No account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )
        )}

        {/* Category — expense only */}
        {type === 'expense' && (
          <div>
            <label className={labelCls}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
              <option value="">Uncategorized</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes <span className="font-normal text-gray-400">(optional)</span></label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes..."
            className={inputCls}
          />
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2 justify-end pt-1 border-t border-border-light dark:border-border-dark">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Add Transaction
          </Button>
        </div>
      </form>
    </Modal>
  )
}
