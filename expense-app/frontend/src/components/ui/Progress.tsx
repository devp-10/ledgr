import { clsx } from 'clsx'

interface ProgressProps {
  value: number // 0–100
  max?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md'
}

function getProgressColor(pct: number): string {
  if (pct >= 100) return 'from-danger-500 to-danger-400'
  if (pct >= 80) return 'from-warning-500 to-warning-400'
  return 'from-primary-500 to-accent-500'
}

export function Progress({ value, max = 100, className, showLabel, size = 'sm' }: ProgressProps) {
  const pct = Math.min(100, (value / max) * 100)
  const colorClass = getProgressColor(pct)

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className={clsx(
        'flex-1 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700',
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      )}>
        <div
          className={clsx('h-full rounded-full bg-gradient-to-r transition-all duration-700', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400 w-8 text-right">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
