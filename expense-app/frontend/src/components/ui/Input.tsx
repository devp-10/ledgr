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
          <label className="text-xs font-medium text-white/50">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-white/30 pointer-events-none">
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'input-dark w-full text-sm',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              prefix ? 'pl-9' : 'pl-3',
              suffix ? 'pr-9' : 'pr-3',
              'py-2',
              error && 'border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/20',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-white/30 pointer-events-none">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
