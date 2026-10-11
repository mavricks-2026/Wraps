'use client'
import { useState } from 'react'
import { cn } from '@goodsly/utils'
import { useSession } from '@/lib/use-session'
import {
  useIsWishlisted,
  useAddToWishlist,
  useRemoveFromWishlist,
} from '@/lib/use-wishlist'

export function WishlistButton({
  productId,
  className,
}: {
  productId: string
  className?: string
}) {
  const { user } = useSession()
  const { isWishlisted } = useIsWishlisted(productId)
  const add = useAddToWishlist()
  const remove = useRemoveFromWishlist()
  const [error, setError] = useState<string | null>(null)

  const pending = add.isPending || remove.isPending

  async function handleToggle() {
    setError(null)
    if (!user) {
      window.location.href = `/sign-in?redirect=${window.location.pathname}`
      return
    }
    try {
      if (isWishlisted) {
        await remove.mutateAsync(productId)
      } else {
        await add.mutateAsync(productId)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update wishlist')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        aria-pressed={isWishlisted}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={cn(
          'inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold transition-colors disabled:opacity-50',
          isWishlisted
            ? 'border-pink bg-soft text-pink-strong hover:bg-soft/70'
            : 'border-line text-ink hover:border-pink hover:text-plum',
          className,
        )}
      >
        <span className="msym msym-filled text-[20px] leading-none" aria-hidden>
          favorite
        </span>
        {isWishlisted ? 'Saved to wishlist' : 'Add to wishlist'}
      </button>
      {error && <p className="mt-1 text-sm text-pink-strong">{error}</p>}
    </div>
  )
}
