'use client'
import { useState, useTransition } from 'react'
import { Button } from '@goodsly/ui'
import { approveReview, deleteReview } from './actions'

interface Props {
  reviewId: string
  isApproved: boolean
}

export function ReviewActions({ reviewId, isApproved }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function approve(next: boolean) {
    setError(null)
    startTransition(async () => {
      const res = await approveReview(reviewId, next)
      if (!res.ok) setError(res.error)
    })
  }

  function remove() {
    if (!confirm('Delete this review?')) return
    setError(null)
    startTransition(async () => {
      const res = await deleteReview(reviewId)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {isApproved ? (
          <Button size="sm" variant="outline" onClick={() => approve(false)} disabled={pending}>
            Unpublish
          </Button>
        ) : (
          <Button size="sm" onClick={() => approve(true)} disabled={pending}>
            Approve
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
          Delete
        </Button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
