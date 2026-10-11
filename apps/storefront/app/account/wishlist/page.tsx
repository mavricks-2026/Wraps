'use client'
import Link from 'next/link'
import { formatINR } from '@goodsly/utils'
import { useWishlist, useRemoveFromWishlist } from '@/lib/use-wishlist'
export default function WishlistPage() {
  const { data, isLoading } = useWishlist()
  const remove = useRemoveFromWishlist()
  const items = data ?? []
  return (
    <div className="space-y-6">
      <h2 className="mb-1 font-display text-h2 font-semibold text-ink">Wishlist</h2>
      {isLoading ? (<p className="text-body-sm text-muted">Loading…</p>) : items.length === 0 ? (
        <div className="rounded-card border border-line bg-surface px-6 py-14 text-center shadow-card">
          <h3 className="font-display text-lg font-semibold text-ink">Nothing saved yet</h3>
          <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-plum">Browse products</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id}>
              <p className="font-display text-sm font-semibold text-ink">{item.products?.name ?? 'Saved item'}</p>
              <button type="button" onClick={() => item.products && remove.mutate(item.products.id)} className="mt-2 text-xs uppercase tracking-wider text-muted">Remove</button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">Prices: {items.length > 0 ? formatINR(items[0]?.products?.base_price ?? 0) : formatINR(0)}</p>
    </div>
  )
}