import { cn } from '@goodsly/utils'
import type { OrderStatus } from '@/types/db'

const TONES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-sky-100 text-sky-900',
  packed: 'bg-indigo-100 text-indigo-900',
  shipped: 'bg-violet-100 text-violet-900',
  delivered: 'bg-emerald-100 text-emerald-900',
  cancelled: 'bg-stone-200 text-stone-700',
  returned: 'bg-rose-100 text-rose-900',
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        TONES[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
