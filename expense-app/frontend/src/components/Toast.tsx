import { clsx } from 'clsx'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { Toast as ToastType, ToastType as TType } from '../hooks/useToast'

const TYPE_STYLES: Record<TType, string> = {
  success: 'bg-white dark:bg-gray-800 border-success-500/30 text-success-700 dark:text-success-400',
  error: 'bg-white dark:bg-gray-800 border-danger-500/30 text-danger-700 dark:text-danger-400',
  info: 'bg-white dark:bg-gray-800 border-accent-500/30 text-accent-700 dark:text-accent-400',
}

const TYPE_ICONS: Record<TType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />,
  error: <XCircle size={16} className="text-danger-500 flex-shrink-0" />,
  info: <Info size={16} className="text-accent-500 flex-shrink-0" />,
}

interface Props {
  toasts: ToastType[]
  onRemove: (id: number) => void
}

export function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium',
            'min-w-[280px] max-w-sm pointer-events-auto animate-slide-in',
            TYPE_STYLES[t.type],
          )}
        >
          {TYPE_ICONS[t.type]}
          <span className="flex-1 text-gray-800 dark:text-gray-200">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-1 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
