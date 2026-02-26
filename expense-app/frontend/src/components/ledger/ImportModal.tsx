import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckSquare, Plus } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import { api, UploadPreviewResponse, Account } from '../../lib/api'
import { POLL_INTERVAL_MS } from '../../constants'
import { useToastContext } from '../../App'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

type Step = 'upload' | 'preview' | 'importing' | 'done'

export function ImportModal({ open, onClose, onComplete }: ImportModalProps) {
  const addToast = useToastContext()
  const [step, setStep] = useState<Step>('upload')
  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null)
  const [autoCategorize, setAutoCategorize] = useState(true)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>(undefined)
  const [showNewAccount, setShowNewAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')

  useEffect(() => {
    if (open) {
      api.getAccounts().then(setAccounts).catch(() => {})
    }
  }, [open])

  const reset = () => {
    setStep('upload')
    setPreview(null)
    setProgress(0)
    setProgressMsg('')
    setUploading(false)
    setFileName('')
    setSelectedAccountId(undefined)
    setShowNewAccount(false)
    setNewAccountName('')
  }

  const handleCreateAccount = async () => {
    const name = newAccountName.trim()
    if (!name) return
    try {
      const account = await api.addAccount(name)
      setAccounts(prev => [...prev, account].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedAccountId(account.id)
      setNewAccountName('')
      setShowNewAccount(false)
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to create account', 'error')
    }
  }

  const handleClose = () => { reset(); onClose() }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    onDrop: useCallback(async (files: File[]) => {
      if (!files[0]) return
      setUploading(true)
      setFileName(files[0].name)
      try {
        const result = await api.upload(files[0])
        setPreview(result)
        setStep('preview')
      } catch {
        addToast('Failed to parse file. Check the format and try again.', 'error')
      } finally {
        setUploading(false)
      }
    }, [addToast]),
  })

  const handleImport = async () => {
    if (!preview || !preview.transactions.length) return
    setStep('importing')
    setProgress(5)
    setProgressMsg('Importing transactions...')

    try {
      const result = await api.importTransactions({
        transactions: preview.transactions,
        source_file: fileName,
        account_id: selectedAccountId,
        auto_categorize: autoCategorize,
      })

      if (autoCategorize && result.job_id) {
        setProgressMsg('Categorizing with AI...')
        const poll = setInterval(async () => {
          try {
            const status = await api.getCategorizationStatus(result.job_id!)
            const pct = status.total > 0 ? Math.round((status.completed / status.total) * 100) : 100
            setProgress(10 + pct * 0.85)
            setProgressMsg(`Categorizing ${status.completed} of ${status.total}...`)

            if (status.status === 'complete' || status.status === 'error') {
              clearInterval(poll)
              setProgress(100)
              setProgressMsg('Done!')
              setTimeout(() => { setStep('done'); onComplete() }, 500)
            }
          } catch {
            clearInterval(poll)
            setStep('done')
            onComplete()
          }
        }, POLL_INTERVAL_MS)
      } else {
        setProgress(100)
        setProgressMsg(`Imported ${result.imported} transactions`)
        setTimeout(() => { setStep('done'); onComplete() }, 800)
      }
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Import failed', 'error')
      setStep('preview')
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import Transactions" size="lg">
      <div className="p-6">

        {/* STEP: Upload */}
        {step === 'upload' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Parsing file...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3">
                  <Upload size={22} className="text-primary-600 dark:text-primary-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop a CSV or Excel file'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">or click to browse · .csv, .xlsx, .xls</p>
              </>
            )}
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && preview && (
          <div className="space-y-5">
            {/* File info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <FileText size={18} className="text-primary-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{fileName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {preview.total_rows} transactions detected
                  {preview.duplicate_count > 0 && ` · ${preview.duplicate_count} potential duplicates`}
                </p>
              </div>
            </div>

            {/* Column mapping info */}
            {Object.keys(preview.columns_detected).length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Detected Columns</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preview.columns_detected).map(([field, col]) => (
                    <div key={field} className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg px-2 py-1">
                      <span className="font-medium text-gray-600 dark:text-gray-300 capitalize">{field}:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-mono">{col}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction preview */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Description</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.transactions.slice(0, 3).map((t, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700/60 last:border-0">
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{t.date}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-300 truncate max-w-[160px]">{t.description}</td>
                      <td className={`px-3 py-2 text-right font-money font-medium ${t.amount >= 0 ? 'text-success-600 dark:text-success-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.total_rows > 3 && (
                <p className="text-xs text-gray-400 px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                  Showing 3 of {preview.total_rows} transactions
                </p>
              )}
            </div>

            {/* Account selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Account <span className="font-normal text-gray-400">(optional)</span>
              </label>
              {showNewAccount ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newAccountName}
                    onChange={e => setNewAccountName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateAccount()
                      if (e.key === 'Escape') setShowNewAccount(false)
                    }}
                    placeholder="Account name..."
                    className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <Button variant="primary" size="sm" onClick={handleCreateAccount}>Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowNewAccount(false); setNewAccountName('') }}>Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedAccountId ?? ''}
                    onChange={e => setSelectedAccountId(e.target.value ? Number(e.target.value) : undefined)}
                    className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">No account</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewAccount(true)}
                    title="Add new account"
                    className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-400 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCategorize}
                  onChange={e => setAutoCategorize(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-categorize with AI (Ollama)</span>
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 ml-6.5">
                Duplicate transactions are always skipped automatically.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>← Back</Button>
              <Button variant="primary" onClick={handleImport}>
                Import {preview.total_rows} Records
              </Button>
            </div>
          </div>
        )}

        {/* STEP: Importing / Done */}
        {(step === 'importing' || step === 'done') && (
          <div className="space-y-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              {step === 'done'
                ? <CheckSquare size={20} className="text-success-500 flex-shrink-0" />
                : <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              }
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{progressMsg}</p>
            </div>
            <Progress value={progress} size="md" />
            {step === 'done' && (
              <Button variant="primary" className="w-full mt-4" onClick={handleClose}>
                Done
              </Button>
            )}
          </div>
        )}

      </div>
    </Modal>
  )
}
