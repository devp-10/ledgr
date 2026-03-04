import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Plan } from './pages/Plan'
import { Reflect } from './pages/Reflect'
import { Ledger } from './pages/Ledger'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'
import { api } from './lib/api'
import { setCategoryEmojiMap } from './components/ui/Badge'

// ── Toast ─────────────────────────────────────────────────────────────────────
type AddToast = (message: string, type?: 'success' | 'error' | 'info') => void
export const ToastContext = createContext<AddToast>(() => {})
export const useToastContext = () => useContext(ToastContext)

// ── Categories — single source of truth for the whole app ─────────────────────
interface CategoriesCtx {
  /** Flat list of budget_category names (string[]) for dropdowns/filters */
  categories: string[]
  /** Call after any mutation to budget_categories so every page stays in sync */
  refreshCategories: () => void
}
const CategoriesContext = createContext<CategoriesCtx>({ categories: [], refreshCategories: () => {} })
export const useCategoriesContext = () => useContext(CategoriesContext)

export default function App() {
  const { toasts, addToast, removeToast } = useToast()
  const [categories, setCategories] = useState<string[]>([])

  const refreshCategories = useCallback(() => {
    api.getCategories().then(r => {
      const items = r.categories ?? []
      setCategories(items.map(c => c.name))
      setCategoryEmojiMap(Object.fromEntries(items.map(c => [c.name, c.emoji])))
    }).catch(() => {})
  }, [])

  // Load once on mount so every page has correct emojis/colours immediately
  useEffect(() => { refreshCategories() }, [refreshCategories])

  return (
    <ToastContext.Provider value={addToast}>
      <CategoriesContext.Provider value={{ categories, refreshCategories }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Plan />} />
              <Route path="reflect" element={<Reflect />} />
              <Route path="ledger" element={<Ledger />} />
            </Route>
          </Routes>
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </BrowserRouter>
      </CategoriesContext.Provider>
    </ToastContext.Provider>
  )
}
