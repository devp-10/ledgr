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
        <h1 className="text-xl font-bold gradient-text">Settings</h1>
        <p className="text-sm text-white/30 mt-1">Configure your Ledgr preferences</p>
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
              <label className="text-xs font-medium text-white/40 mb-1 block">Model</label>
              <select
                value={settings.model}
                onChange={e => setSettings(s => ({ ...s, model: e.target.value }))}
                className="input-dark w-full text-sm px-3 py-2"
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
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                testResult.connected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
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

            <div className="border-t border-white/06 pt-4">
              <Button
                variant="secondary"
                size="sm"
                loading={recategorizing}
                onClick={handleRecategorize}
              >
                <RefreshCw size={14} />
                Re-categorize All Transactions
              </Button>
              <p className="text-xs text-white/25 mt-1.5">
                Uses the selected AI model to re-categorize all existing transactions.
              </p>
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
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={14} />
              Export All Transactions (CSV)
            </Button>

            <div className="border-t border-white/06 pt-3">
              {confirmClear ? (
                <div className="space-y-2">
                  <p className="text-sm text-red-400 font-medium">
                    ⚠️ This will permanently delete all transactions. Are you sure?
                  </p>
                  <div className="flex gap-2">
                    <Button variant="danger" size="sm" loading={clearing} onClick={handleClear}>
                      <Trash2 size={14} />
                      Yes, clear all data
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" size="sm" onClick={handleClear}>
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
          <div className="space-y-2 text-sm text-white/40">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-primary-400" />
              <span>Ledgr v1.0.0 — Local-first expense tracker with AI categorization</span>
            </div>
            {testResult?.connected && (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Ollama: Connected ({settings.model})</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
