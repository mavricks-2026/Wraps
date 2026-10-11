import * as React from 'react'
import { cn } from '@goodsly/utils'

type Tone = 'neutral' | 'sale' | 'new' | 'low-stock'

const tones: Record<Tone, string> = {
  neutral: 'bg-tint text-plum',
  sale: 'bg-pink text-white',
  new: 'bg-plum text-blush',
  'low-stock': 'bg-amber-100 text-amber-900',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
