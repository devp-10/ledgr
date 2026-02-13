import { createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Reports } from './pages/Reports'
import { Upload } from './pages/Upload'
import { Settings } from './pages/Settings'
import { ToastContainer } from './components/Toast'
import { useToast } from './hooks/useToast'

type AddToast = (message: string, type?: 'success' | 'error' | 'info') => void

export const ToastContext = createContext<AddToast>(() => {})
export const useToastContext = () => useContext(ToastContext)

export default function App() {
  const { toasts, addToast, removeToast } = useToast()

  return (
    <ToastContext.Provider value={addToast}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </BrowserRouter>
    </ToastContext.Provider>
  )
}
