import { clsx } from 'clsx'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { Toast as ToastType, ToastType as TType } from '../hooks/useToast'

const TYPE_STYLES: Record<TType, string> = {
  success: 'border-emerald-500/30',
  error:   'border-red-500/30',
  info:    'border-cyan-500/30',
}

const TYPE_ICONS: Record<TType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />,
  error:   <XCircle size={16} className="text-red-400 flex-shrink-0" />,
  info:    <Info size={16} className="text-cyan-400 flex-shrink-0" />,
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
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
            'min-w-[280px] max-w-sm pointer-events-auto animate-slide-in glass border',
            TYPE_STYLES[t.type],
          )}
        >
          {TYPE_ICONS[t.type]}
          <span className="flex-1 text-white/80">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="text-white/30 hover:text-white/60 ml-1 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
