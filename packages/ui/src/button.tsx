import * as React from 'react'
import { cn } from '@goodsly/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center font-medium tracking-wide uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-900 text-cream hover:bg-brand-700',
  secondary: 'bg-brand-100 text-brand-900 hover:bg-brand-200',
  ghost: 'bg-transparent text-brand-900 hover:bg-brand-50',
  outline: 'border border-brand-900 text-brand-900 hover:bg-brand-900 hover:text-cream',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-8 text-sm',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  ),
)
Button.displayName = 'Button'