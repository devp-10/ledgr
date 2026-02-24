import { clsx } from 'clsx'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function Progress({ value, max = 100, className, showLabel, size = 'sm' }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const colorClass =
    pct >= 100
      ? 'bg-status-negative'
      : pct >= 80
      ? 'bg-status-warning'
      : 'bg-status-positive'

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx(
          'flex-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2'
        )}
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-money text-gray-500 dark:text-gray-400 w-10 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
