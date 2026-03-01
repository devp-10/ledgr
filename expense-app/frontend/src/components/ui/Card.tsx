import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-lg bg-surface dark:bg-[#171717] border border-border-light dark:border-border-dark shadow-card',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('px-5 pt-5 pb-3', className)} {...props} />
)

export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx('px-5 pb-5', className)} {...props} />
)

export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={clsx('text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide', className)} {...props} />
)
