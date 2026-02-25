import { createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Plan } from './pages/Plan'
import { Reflect } from './pages/Reflect'
import { Ledger } from './pages/Ledger'
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
            <Route index element={<Plan />} />
            <Route path="reflect" element={<Reflect />} />
            <Route path="ledger" element={<Ledger />} />
          </Route>
        </Routes>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </BrowserRouter>
    </ToastContext.Provider>
  )
}
