import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
  gradient?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, glass, gradient, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-xl border',
          glass
            ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/30 dark:border-gray-700/50'
            : gradient
            ? 'bg-gradient-to-br from-primary-500/10 to-accent-500/5 border-primary-200/50 dark:border-primary-800/30'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          hover && 'transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover',
          'shadow-card',
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
  <h3 className={clsx('text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider', className)} {...props} />
)
