'use client'
import { useMemo, useState } from 'react'
import { Button, Badge } from '@/components/ui'
import { cn, formatINR, isLowStock, isOutOfStock } from '@goodsly/utils'
import { useAddToCart } from '@/lib/use-cart'
import { useCartUI } from '@/lib/cart-store'
import { useSession } from '@/lib/use-session'
import { ProductGallery } from './ProductGallery'
import { ProductReviews } from './ProductReviews'
import { WishlistButton } from './WishlistButton'

interface InventoryRow {
  qty_available: number
  qty_reserved: number
}

interface Variant {
  id: string
  sku: string
  color: string | null
  size: string | null
  price: number
  compare_price: number | null
  is_active: boolean
  inventory: InventoryRow | InventoryRow[] | null
}

interface Image {
  id: string
  url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  material: string | null
  care_instructions: string | null
  base_price: number
  compare_price: number | null
  is_gift_packable: boolean
  product_images: Image[]
  product_variants: Variant[]
}

function inventoryOf(v: Variant): InventoryRow | null {
  const inv = v.inventory
  if (!inv) return null
  return Array.isArray(inv) ? (inv[0] ?? null) : inv
}

export function ProductDetail({ product }: { product: Product }) {
  const variants = product.product_variants.filter((v) => v.is_active)
  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color).filter((c): c is string => Boolean(c)))),
    [variants],
  )
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] ?? null)

  const variantsForColor = variants.filter((v) => v.color === selectedColor)
  const sizes = Array.from(
    new Set(variantsForColor.map((v) => v.size).filter((s): s is string => Boolean(s))),
  )
  const [selectedSize, setSelectedSize] = useState<string | null>(sizes[0] ?? null)

  const selectedVariant =
    variantsForColor.find((v) => (sizes.length === 0 ? true : v.size === selectedSize)) ?? variantsForColor[0]

  const inv = selectedVariant ? inventoryOf(selectedVariant) : null
  const outOfStock = inv ? isOutOfStock(inv.qty_available, inv.qty_reserved) : false
  const lowStock = inv ? isLowStock(inv.qty_available, inv.qty_reserved) : false

  const price = selectedVariant?.price ?? product.base_price
  const comparePrice = selectedVariant?.compare_price ?? product.compare_price
  const onSale = comparePrice !== null && comparePrice !== undefined && comparePrice > price

  const sortedImages = [...product.product_images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    return a.sort_order - b.sort_order
  })

  const { user } = useSession()
  const addToCart = useAddToCart()
  const openCart = useCartUI((s) => s.open)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!selectedVariant) return
    setError(null)
    if (!user) {
      window.location.href = `/sign-in?redirect=/products/${product.slug}`
      return
    }
    try {
      await addToCart.mutateAsync({ variantId: selectedVariant.id, quantity: 1 })
      openCart()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add to cart')
    }
  }

  return (
    <>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-12 md:grid-cols-2">
        <ProductGallery images={sortedImages} productName={product.name} />

        <div className="space-y-6">
          <div>
            <h1 className="font-display text-h1 font-semibold text-ink">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <span className={cn('font-display text-2xl font-semibold', onSale ? 'text-pink' : 'text-plum')}>
                {formatINR(price)}
              </span>
              {onSale && (
                <span className="text-lg text-muted line-through">{formatINR(comparePrice)}</span>
              )}
              {onSale && <Badge tone="sale">Sale</Badge>}
              {lowStock && !outOfStock && <Badge tone="low-stock">Low stock</Badge>}
            </div>
          </div>

          {product.description && (
            <p className="leading-relaxed text-body text-muted">{product.description}</p>
          )}

          {colors.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted">
                Colour: <span className="text-ink">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'rounded-control border px-4 py-2 text-xs uppercase tracking-wider transition-colors',
                      color === selectedColor
                        ? 'border-pink bg-pink text-white'
                        : 'border-line text-ink hover:border-pink',
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-muted">
                Size: <span className="text-ink">{selectedSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      'min-w-[3rem] rounded-control border px-4 py-2 text-xs uppercase tracking-wider transition-colors',
                      size === selectedSize
                        ? 'border-pink bg-pink text-white'
                        : 'border-line text-ink hover:border-pink',
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full"
              disabled={!selectedVariant || outOfStock || addToCart.isPending}
              onClick={handleAdd}
            >
              {outOfStock ? 'Out of stock' : addToCart.isPending ? 'Adding…' : 'Add to cart'}
            </Button>
            {error && <p className="text-sm text-pink-strong">{error}</p>}
            {!user && (
              <p className="text-xs text-muted">
                You&apos;ll be asked to sign in to keep your cart.
              </p>
            )}
            <WishlistButton productId={product.id} />
          </div>

          {product.is_gift_packable && (
            <div className="rounded-control bg-soft px-4 py-3 text-sm text-plum">
              <span className="msym msym-filled mr-1 align-middle text-[18px]" aria-hidden>
                featured_seasonal_and_gifts
              </span>
              Free gift wrapping available at checkout
            </div>
          )}

          <div className="space-y-4 border-t border-line pt-6 text-sm">
            {product.material && (
              <Detail label="Material">{product.material}</Detail>
            )}
            {product.care_instructions && (
              <Detail label="Care">{product.care_instructions}</Detail>
            )}
            <Detail label="Shipping">Free shipping across India · Delivered in 3-7 days</Detail>
            <Detail label="Returns">Easy 7-day returns on unused products</Detail>
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} slug={product.slug} />
    </>
  )
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-4">
      <span className="pt-0.5 text-xs uppercase tracking-wider text-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </div>
  )
}
