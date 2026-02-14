import { clsx } from 'clsx'

interface ProgressProps {
  value: number // 0–100
  max?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function Progress({ value, max = 100, className, showLabel, size = 'sm' }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const fillClass = pct >= 100 ? 'progress-danger' : pct >= 80 ? 'progress-warning' : 'progress-neon'

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className={clsx(
        'flex-1 progress-track',
        size === 'sm' ? 'h-1' : 'h-1.5'
      )}>
        <div className={fillClass} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-xs font-money text-white/40 w-8 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
