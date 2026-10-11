import * as React from 'react'
import { cn } from '@goodsly/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-display font-semibold tracking-wide transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<Variant, string> = {
  primary: 'bg-pink text-white hover:bg-plum shadow-glow hover:shadow-none',
  secondary: 'bg-plum text-white hover:bg-plum-deep',
  ghost: 'bg-transparent text-plum hover:bg-pink-soft',
  outline: 'border border-pink text-plum hover:bg-pink-soft',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-full',
  md: 'h-11 px-6 text-sm rounded-full',
  lg: 'h-12 px-8 text-base rounded-full',
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
