import * as React from 'react'
import { cn } from '@goodsly/utils'

type Tone = 'neutral' | 'sale' | 'new' | 'low-stock'

const tones: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700',
  sale: 'bg-red-600 text-white',
  new: 'bg-brand-900 text-cream',
  'low-stock': 'bg-amber-100 text-amber-900',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}