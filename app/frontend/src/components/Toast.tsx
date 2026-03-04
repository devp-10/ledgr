import { clsx } from 'clsx'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { Toast as ToastType, ToastType as TType } from '../hooks/useToast'

const TYPE_STYLES: Record<TType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
}

const TYPE_ICONS: Record<TType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />,
  error: <XCircle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />,
  info: <Info size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />,
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
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border shadow-card',
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
