import { useState, useEffect, useRef } from 'react'
import { api, OllamaSettings, OllamaTestResult } from '../lib/api'
import { useToastContext } from '../App'

export function Settings() {
  const addToast = useToastContext()

  const [ollamaSettings, setOllamaSettings] = useState<OllamaSettings>({
    url: 'http://localhost:11434',
    model: '',
  })
  const [testResult, setTestResult] = useState<OllamaTestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  const [categories, setCategories] = useState<string[]>([])
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [addingCat, setAddingCat] = useState(false)

  const [exporting, setExporting] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)

  const [recatStatus, setRecatStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [recatProgress, setRecatProgress] = useState({ completed: 0, total: 0 })
  const [recatError, setRecatError] = useState('')
  const recatPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api.getOllamaSettings().then(s => setOllamaSettings(s))
    api.getCategories().then(r => {
      setCategories(r.categories)
      setCustomCategories(r.custom)
    })
  }, [])

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await api.testOllama(ollamaSettings)
      setTestResult(result)
    } finally {
      setTesting(false)
    }
  }

  const handleSaveOllama = async () => {
    setSaving(true)
    try {
      await api.saveOllamaSettings(ollamaSettings)
      addToast('Ollama settings saved', 'success')
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    setAddingCat(true)
    try {
      await api.addCategory(newCategory.trim())
      const r = await api.getCategories()
      setCategories(r.categories)
      setCustomCategories(r.custom)
      setNewCategory('')
      addToast(`Category "${newCategory.trim()}" added`, 'success')
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Failed to add category', 'error')
    } finally {
      setAddingCat(false)
    }
  }

  const handleRecategorize = async () => {
    setRecatStatus('running')
    setRecatProgress({ completed: 0, total: 0 })
    setRecatError('')
    try {
      const result = await api.recategorize()
      if (!result.job_id) {
        setRecatStatus('done')
        return
      }
      setRecatProgress(p => ({ ...p, total: result.total }))
      recatPollRef.current = setInterval(async () => {
        try {
          const status = await api.getCategorizationStatus(result.job_id!)
          setRecatProgress({ completed: status.completed, total: status.total })
          if (status.status === 'done') {
            clearInterval(recatPollRef.current!)
            setRecatStatus('done')
          } else if (status.status.startsWith('error')) {
            clearInterval(recatPollRef.current!)
            setRecatStatus('error')
            setRecatError(status.status.replace(/^error:\s*/, ''))
          }
        } catch {
          clearInterval(recatPollRef.current!)
          setRecatStatus('error')
          setRecatError('Lost connection to backend')
        }
      }, 2000)
    } catch (e: unknown) {
      setRecatStatus('error')
      setRecatError(e instanceof Error ? e.message : 'Failed to start re-categorization')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.exportCsv()
      if (!response.ok) throw new Error('Export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transactions.csv'
      a.click()
      URL.revokeObjectURL(url)
      addToast('Data exported successfully', 'success')
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Export failed', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleClearData = async () => {
    setClearing(true)
    try {
      await api.clearData()
      addToast('All data cleared', 'success')
      setShowClearConfirm(false)
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Failed to clear data', 'error')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Ollama configuration */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Ollama Configuration</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Configure the local Ollama instance used for transaction categorization.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ollama URL
            </label>
            <input
              type="text"
              value={ollamaSettings.url}
              onChange={e => setOllamaSettings(s => ({ ...s, url: e.target.value }))}
              placeholder="http://localhost:11434"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <input
              type="text"
              value={ollamaSettings.model}
              onChange={e => setOllamaSettings(s => ({ ...s, model: e.target.value }))}
              placeholder="llama3.2"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.connected
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}>
              <span className="font-medium">{testResult.connected ? '✓' : '✕'} </span>
              {testResult.message}
              {testResult.available_models && testResult.available_models.length > 0 && (
                <div className="mt-1 text-xs opacity-70">
                  Available models: {testResult.available_models.join(', ')}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test connection'}
            </button>
            <button
              onClick={handleSaveOllama}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </section>

      {/* Custom categories */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Custom Categories</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Add categories beyond the built-in set.
        </p>

        {customCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {customCategories.map(c => (
              <span
                key={c}
                className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">No custom categories yet.</p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New category name"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleAddCategory}
            disabled={addingCat || !newCategory.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </section>

      {/* Data management */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Data Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Export your data or clear all transactions.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRecategorize}
            disabled={recatStatus === 'running'}
            className="px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
          >
            {recatStatus === 'running' ? 'Re-categorizing...' : 'Re-categorize all with Ollama'}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export all data as CSV'}
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Clear all data
          </button>
        </div>

        {recatStatus === 'running' && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Categorizing with Ollama...</span>
              <span>{recatProgress.completed} / {recatProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: recatProgress.total ? `${(recatProgress.completed / recatProgress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {recatStatus === 'done' && (
          <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">
            Done — all transactions have been re-categorized.
          </p>
        )}

        {recatStatus === 'error' && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            Error: {recatError}
          </p>
        )}

        {showClearConfirm && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-3">
              Are you sure? This will permanently delete all transactions and categories. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClearData}
                disabled={clearing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {clearing ? 'Clearing...' : 'Yes, clear everything'}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Built-in categories reference */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">Built-in Categories</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          These categories are used by Ollama for automatic classification.
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.filter(c => !customCategories.includes(c)).map(c => (
            <span
              key={c}
              className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs"
            >
              {c}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
