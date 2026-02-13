import clsx from 'clsx'
import { Toast as ToastType, ToastType as TType } from '../hooks/useToast'

const TYPE_STYLES: Record<TType, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
}

const TYPE_ICONS: Record<TType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
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
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium',
            'min-w-72 max-w-sm pointer-events-auto',
            TYPE_STYLES[t.type],
          )}
        >
          <span className="text-base leading-none">{TYPE_ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="opacity-70 hover:opacity-100 ml-1 text-base leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
