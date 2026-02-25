import { useState, useEffect, useRef } from 'react'
import { CreditCard, Plus, Trash2, X } from 'lucide-react'
import { clsx } from 'clsx'
import { api } from '../../lib/api'
import { Account } from '../../types'
import { Button } from '../ui/Button'

export function AccountsPopover() {
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Reload accounts whenever popover opens
  useEffect(() => {
    if (open) {
      api.getAccounts().then(setAccounts).catch(() => {})
    } else {
      setShowAdd(false)
      setAddName('')
      setConfirmDeleteId(null)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleAdd = async () => {
    if (!addName.trim()) return
    try {
      const account = await api.addAccount(addName.trim())
      setAccounts(prev => [...prev, account].sort((a, b) => a.name.localeCompare(b.name)))
      setAddName('')
      setShowAdd(false)
    } catch {}
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAccount(id)
      setAccounts(prev => prev.filter(a => a.id !== id))
      setConfirmDeleteId(null)
    } catch {}
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
          open
            ? 'text-accent-600 dark:text-accent-400 bg-accent-500/10'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
        )}
      >
        <CreditCard size={15} />
        Accounts
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg bg-surface dark:bg-[#171717] border border-border-light dark:border-border-dark shadow-soft z-50 overflow-hidden animate-fade-in">
          {/* Popover header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800/60">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Accounts
            </span>
            <div className="flex items-center gap-2">
              {!showAdd && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                >
                  <Plus size={12} /> Add
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Account list */}
          <div className="max-h-72 overflow-y-auto">
            {accounts.length === 0 && !showAdd && (
              <p className="text-xs text-gray-400 dark:text-gray-500 px-4 py-5 text-center">
                No accounts yet — add your banks and credit cards.
              </p>
            )}
            {accounts.map(account => (
              <div
                key={account.id}
                className="relative group/acct flex items-center gap-3 py-2.5 px-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors border-b border-border-light dark:border-border-dark last:border-0"
              >
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{account.name}</span>
                {confirmDeleteId === account.id ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400 dark:text-gray-500">
                      {account.transaction_count > 0
                        ? `Unlinks ${account.transaction_count} txn${account.transaction_count !== 1 ? 's' : ''} —`
                        : 'Delete?'}
                    </span>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="text-status-negative hover:underline font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {account.transaction_count} txn{account.transaction_count !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => {
                        if (account.transaction_count === 0) handleDelete(account.id)
                        else setConfirmDeleteId(account.id)
                      }}
                      className="absolute right-3 opacity-0 group-hover/acct:opacity-100 p-1 rounded text-gray-400 hover:text-status-negative transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="px-4 py-3 border-t border-border-light dark:border-border-dark">
              <input
                autoFocus
                value={addName}
                onChange={e => setAddName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd()
                  if (e.key === 'Escape') { setShowAdd(false); setAddName('') }
                }}
                placeholder="e.g. Chase Sapphire, BofA Checking..."
                className="w-full rounded-md border border-border-light dark:border-border-dark bg-surface dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 px-3 py-1.5 mb-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setShowAdd(false); setAddName('') }}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleAdd}>
                  Add Account
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
