import * as React from 'react'
import { cn } from '@goodsly/utils'

const field =
  'w-full rounded-control border border-line bg-white px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors focus:border-pink focus:outline-none focus:ring-2 focus:ring-pink/25'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(field, 'h-11', className)} {...props} />
  ),
)
Input.displayName = 'Input'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(field, 'min-h-[96px] py-3', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(field, 'h-11 appearance-none', className)} {...props} />
  ),
)
Select.displayName = 'Select'
