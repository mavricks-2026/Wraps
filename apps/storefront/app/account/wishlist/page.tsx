'use client'
import Link from 'next/link'
import { formatINR, cn } from '@goodsly/utils'
import {
  useWishlist,
  useRemoveFromWishlist,
  type WishlistItem,
} from '@/lib/use-wishlist'

function primaryImageUrl(item: WishlistItem) {
  const imgs = [...(item.products?.product_images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    return a.sort_order - b.sort_order
  })
  return imgs[0] ?? null
}

export default function WishlistPage() {
  const { data, isLoading } = useWishlist()
  const remove = useRemoveFromWishlist()
  const items = data ?? []

  return (
    <div className="space-y-6">
      <header>
        <h2 className="mb-1 font-display text-h2 font-semibold text-ink">Wishlist</h2>
        <p className="text-body-sm text-muted">
          {isLoading
            ? 'Loading your saved products…'
            : items.length === 0
              ? 'Pieces you save will live here.'
              : `${items.length} ${items.length === 1 ? 'product' : 'products'} saved.`}
        </p>
      </header>

      {!isLoading && items.length === 0 ? (
        <div className="rounded-card border border-line bg-surface px-6 py-14 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soft">
            <span className="msym msym-filled text-[28px] text-pink" aria-hidden>
              favorite
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-ink">Nothing saved yet</h3>
          <p className="mt-1 text-body-sm text-muted">
            Tap the heart on any product to keep it here.
          </p>
          <div className="mt-5">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-plum hover:shadow-none"
            >
              Browse products
            </Link>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-5 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.products
            if (!product) return null
            const image = primaryImageUrl(item)
            const onSale =
              product.compare_price !== null &&
              product.compare_price !== undefined &&
              product.compare_price > product.base_price
            return (
              <li key={item.id} className="group">
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="aspect-[3/4] overflow-hidden rounded-image bg-tint">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.url}
                        alt={image.alt_text ?? product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <h3 className="mt-2 font-display text-sm font-semibold text-ink">{product.name}</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-body-sm">
                    <span className={cn(onSale && 'text-pink')}>
                      {formatINR(product.base_price)}
                    </span>
                    {onSale && (
                      <span className="text-xs line-through text-muted">
                        {formatINR(product.compare_price)}
                      </span>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => remove.mutate(product.id)}
                  disabled={remove.isPending}
                  className="mt-2 text-xs uppercase tracking-wider text-muted transition-colors hover:text-pink disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
