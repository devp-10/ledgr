import { InputHTMLAttributes, forwardRef, ReactNode } from 'react'
import { clsx } from 'clsx'

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'suffix'>

interface InputProps extends BaseInputProps {
  label?: string
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-gray-400 dark:text-gray-500 pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-md border bg-surface dark:bg-white/5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'border-border-light dark:border-border-dark',
              'focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefix ? 'pl-9' : 'pl-3',
              suffix ? 'pr-9' : 'pr-3',
              'py-2',
              error && 'border-status-negative focus:ring-red-500/20 focus:border-status-negative',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-gray-400 dark:text-gray-500 pointer-events-none">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-status-negative">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
