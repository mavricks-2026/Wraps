import * as React from 'react'
import { cn } from '@goodsly/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full border border-stone-300 bg-white px-3 text-sm placeholder:text-stone-400 focus:border-brand-900 focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'