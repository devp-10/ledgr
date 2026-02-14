import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
