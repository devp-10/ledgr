import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, glow, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'glass rounded-2xl',
          hover && 'glass-hover cursor-pointer',
          glow && 'shadow-glow-violet',
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
  <h3 className={clsx('text-xs font-semibold text-white/40 uppercase tracking-widest', className)} {...props} />
)
