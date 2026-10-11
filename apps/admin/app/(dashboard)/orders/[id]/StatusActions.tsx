'use client'
import { useState, useTransition } from 'react'
import { Button } from '@goodsly/ui'
import { changeOrderStatus } from './actions'
import type { OrderStatus } from '@/types/db'

const NEXT_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirm',
  packed: 'Mark packed',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  cancelled: 'Cancel',
  returned: 'Mark returned',
}

interface Props {
  orderId: string
  current: OrderStatus
  allowed: OrderStatus[]
}

export function StatusActions({ orderId, current, allowed }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        No further actions available — order is {current}.
      </p>
    )
  }

  function run(next: OrderStatus) {
    setError(null)
    startTransition(async () => {
      const res = await changeOrderStatus(orderId, next, note || undefined)
      if (!res.ok) setError(res.error)
      else setNote('')
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {allowed.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={s === 'cancelled' ? 'outline' : 'primary'}
            onClick={() => run(s)}
            disabled={pending}
          >
            {NEXT_LABELS[s]}
          </Button>
        ))}
      </div>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note (logged with status change)"
        className="w-full h-9 px-3 text-sm border border-stone-300 bg-white focus:border-stone-900 focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
