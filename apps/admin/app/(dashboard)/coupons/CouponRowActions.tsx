'use client'
import { useState, useTransition } from 'react'
import { Button } from '@goodsly/ui'
import { deleteCoupon, toggleCoupon } from './actions'

interface Props {
  couponId: string
  isActive: boolean
}

export function CouponRowActions({ couponId, isActive }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    setError(null)
    startTransition(async () => {
      const res = await toggleCoupon(couponId, !isActive)
      if (!res.ok) setError(res.error)
    })
  }

  function remove() {
    if (!confirm('Delete this coupon? This cannot be undone.')) return
    setError(null)
    startTransition(async () => {
      const res = await deleteCoupon(couponId)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={toggle} disabled={pending}>
          {isActive ? 'Disable' : 'Enable'}
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
          Delete
        </Button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
