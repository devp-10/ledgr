import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, RefreshCw, Download, Trash2, Database } from 'lucide-react'
import { api, OllamaSettings, OllamaTestResult } from '../lib/api'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useToastContext } from '../App'

const OLLAMA_MODELS = ['llama3.2', 'llama3.1', 'mistral', 'phi3', 'gemma2']

export function Settings() {
  const addToast = useToastContext()
  const [settings, setSettings] = useState<OllamaSettings>({ url: '', model: 'llama3.2' })
  const [testResult, setTestResult] = useState<OllamaTestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recategorizing, setRecategorizing] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    api.getOllamaSettings().then(setSettings).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.saveOllamaSettings(settings)
      addToast('Settings saved', 'success')
    } catch {
      addToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await api.testOllama(settings)
      setTestResult(result)
    } catch {
      setTestResult({ connected: false, message: 'Connection failed', available_models: null })
    } finally {
      setTesting(false)
    }
  }

  const handleRecategorize = async () => {
    setRecategorizing(true)
    try {
      const result = await api.recategorize()
      addToast(`Recategorizing ${result.total} transactions...`, 'info')
    } catch {
      addToast('Failed to start recategorization', 'error')
    } finally {
      setRecategorizing(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await api.exportCsv()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ledgr-export-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Export downloaded', 'success')
    } catch {
      addToast('Export failed', 'error')
    }
  }

  const handleClear = async () => {
    if (!confirmClear) { setConfirmClear(true); return }
    setClearing(true)
    try {
      await api.clearData()
      addToast('All data cleared', 'info')
      setConfirmClear(false)
    } catch {
      addToast('Failed to clear data', 'error')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your Ledgr preferences</p>
      </div>

      {/* AI Categorization */}
      <Card>
        <CardHeader>
          <CardTitle>AI Categorization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Ollama URL"
              value={settings.url}
              onChange={e => setSettings(s => ({ ...s, url: e.target.value }))}
              placeholder="http://localhost:11434"
            />

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Model</label>
              <select
                value={settings.model}
                onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                {OLLAMA_MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" loading={testing} onClick={handleTest}>
                Test Connection
              </Button>
              <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
                Save Settings
              </Button>
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                testResult.connected
                  ? 'bg-success-500/10 text-success-700 dark:text-success-400'
                  : 'bg-danger-500/10 text-danger-700 dark:text-danger-400'
              }`}>
                {testResult.connected
                  ? <CheckCircle2 size={16} className="flex-shrink-0" />
                  : <XCircle size={16} className="flex-shrink-0" />
                }
                <span>{testResult.message}</span>
                {testResult.available_models && testResult.available_models.length > 0 && (
                  <span className="ml-auto text-xs opacity-70">
                    {testResult.available_models.length} model{testResult.available_models.length !== 1 ? 's' : ''} available
                  </span>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <Button
                variant="secondary"
                size="sm"
                loading={recategorizing}
                onClick={handleRecategorize}
              >
                <RefreshCw size={14} />
                Re-categorize All Transactions
              </Button>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                Uses the selected AI model to re-categorize all existing transactions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Toggle via the moon/sun icon in the header</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleExport}>
                <Download size={14} />
                Export All Transactions (CSV)
              </Button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              {confirmClear ? (
                <div className="space-y-2">
                  <p className="text-sm text-danger-600 dark:text-danger-400 font-medium">
                    ⚠️ This will permanently delete all transactions. Are you sure?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      loading={clearing}
                      onClick={handleClear}
                    >
                      <Trash2 size={14} />
                      Yes, clear all data
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-danger-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                >
                  <Trash2 size={14} />
                  Clear All Data
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-primary-500" />
              <span>Ledgr v1.0.0 — Local-first expense tracker with AI categorization</span>
            </div>
            {testResult?.connected && (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-success-500" />
                <span>Ollama: Connected ({settings.model})</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
