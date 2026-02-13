import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ParsedTransaction, UploadPreviewResponse, ImportResponse } from '../lib/api'
import { FileUpload } from '../components/FileUpload'
import { useToastContext } from '../App'

type Stage = 'idle' | 'parsing' | 'preview' | 'importing' | 'categorizing' | 'done'

function formatAmount(amount: number) {
  return (amount < 0 ? '-' : '+') + '$' + Math.abs(amount).toFixed(2)
}

export function Upload() {
  const addToast = useToastContext()
  const navigate = useNavigate()

  const [stage, setStage] = useState<Stage>('idle')
  const [preview, setPreview] = useState<UploadPreviewResponse | null>(null)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [catProgress, setCatProgress] = useState({ completed: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleFile = async (file: File) => {
    setCurrentFile(file)
    setError(null)
    setStage('parsing')
    try {
      const result = await api.upload(file)
      setPreview(result)
      setStage('preview')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse file')
      setStage('idle')
      addToast(e instanceof Error ? e.message : 'Failed to parse file', 'error')
    }
  }

  const handleImport = async () => {
    if (!preview || !currentFile) return
    setStage('importing')
    try {
      const result = await api.importTransactions({
        transactions: preview.transactions,
        source_file: currentFile.name,
      })
      setImportResult(result)

      if (result.categorization_status === 'pending' && result.job_id) {
        setStage('categorizing')
        setCatProgress({ completed: 0, total: result.imported })
        pollRef.current = setInterval(async () => {
          try {
            const status = await api.getCategorizationStatus(result.job_id!)
            setCatProgress({ completed: status.completed, total: status.total || result.imported })
            if (status.status === 'done' || status.status.startsWith('error')) {
              if (pollRef.current) clearInterval(pollRef.current)
              if (status.status.startsWith('error')) {
                addToast('Ollama categorization failed. Categories set to "Other".', 'error')
              } else {
                addToast('Transactions categorized successfully!', 'success')
              }
              setStage('done')
            }
          } catch {
            if (pollRef.current) clearInterval(pollRef.current)
            setStage('done')
          }
        }, 2000)
      } else {
        setStage('done')
        addToast(`Imported ${result.imported} transactions`, 'success')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed')
      setStage('preview')
      addToast(e instanceof Error ? e.message : 'Import failed', 'error')
    }
  }

  const reset = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setStage('idle')
    setPreview(null)
    setCurrentFile(null)
    setImportResult(null)
    setError(null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Upload Statement</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Import transactions from a CSV or Excel bank statement</p>
      </div>

      {(stage === 'idle' || stage === 'parsing') && (
        <FileUpload onFile={handleFile} loading={stage === 'parsing'} />
      )}

      {stage === 'preview' && preview && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Preview: {currentFile?.name}</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{preview.total_rows}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Transactions found</div>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{preview.duplicate_count}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Already imported</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {preview.total_rows - preview.duplicate_count}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">New transactions</div>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Detected columns: {Object.entries(preview.columns_detected).map(([k, v]) => (
                <span key={k} className="inline-block mr-3">
                  <span className="font-medium capitalize">{k}</span> → <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{v}</code>
                </span>
              ))}
            </div>
          </div>

          {/* Transaction preview table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
              First {Math.min(20, preview.transactions.length)} of {preview.total_rows} transactions
            </div>
            <div className="overflow-y-auto max-h-64">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-4 py-2 text-left text-gray-500 dark:text-gray-400">Description</th>
                    <th className="px-4 py-2 text-right text-gray-500 dark:text-gray-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {preview.transactions.slice(0, 20).map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">{t.date}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100 max-w-xs truncate">{t.description}</td>
                      <td className={`px-4 py-2 text-right font-medium tabular-nums whitespace-nowrap ${
                        t.amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {formatAmount(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={preview.total_rows - preview.duplicate_count === 0}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
            >
              Import {preview.total_rows - preview.duplicate_count} transactions
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {stage === 'importing' && (
        <div className="flex flex-col items-center gap-4 py-20 text-gray-500 dark:text-gray-400">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p>Importing transactions...</p>
        </div>
      )}

      {stage === 'categorizing' && (
        <div className="max-w-md mx-auto py-20 space-y-4">
          <div className="flex flex-col items-center gap-2 text-gray-700 dark:text-gray-300">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-medium">Categorizing with Ollama...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {catProgress.completed} / {catProgress.total} transactions
            </p>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${catProgress.total > 0 ? (catProgress.completed / catProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {stage === 'done' && importResult && (
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import complete</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {importResult.imported} transactions imported
              {importResult.skipped_duplicates > 0 && `, ${importResult.skipped_duplicates} duplicates skipped`}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/transactions')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              View transactions
            </button>
            <button
              onClick={reset}
              className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Upload another
            </button>
          </div>
        </div>
      )}

      {error && stage === 'idle' && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
