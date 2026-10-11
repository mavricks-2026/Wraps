'use client'
import { useState } from 'react'
import Link from 'next/link'
import { formatINR } from '@goodsly/utils'
import { useRemoveFromCart, useToggleGiftWrap, useUpdateQuantity } from '@/lib/use-cart'
import type { CartLine as CartLineType } from '@goodsly/types'

interface Props {
  line: CartLineType
}

export function CartLine({ line }: Props) {
  const updateQty = useUpdateQuantity()
  const removeFromCart = useRemoveFromCart()
  const toggleGift = useToggleGiftWrap()

  const [showMessage, setShowMessage] = useState(line.gift_wrap)
  const [message, setMessage] = useState(line.gift_message ?? '')

  const variant = line.product_variants
  const product = variant.products
  const primaryImage = product.product_images?.find((i) => i.is_primary) ?? product.product_images?.[0]
  const lineTotal = line.quantity * variant.price

  return (
    <li className="flex gap-4 px-6 py-5">
      <Link
        href={`/products/${product.slug}`}
        className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-image bg-tint"
      >
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryImage.url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="font-display text-sm font-semibold hover:text-plum"
          >
            {product.name}
          </Link>
          <span className="whitespace-nowrap text-sm font-semibold text-plum">{formatINR(lineTotal)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {[variant.color, variant.size].filter(Boolean).join(' · ')}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-line">
            <button
              onClick={() => updateQty.mutate({ id: line.id, quantity: line.quantity - 1 })}
              className="h-8 w-8 rounded-full transition-colors hover:bg-tint disabled:opacity-50"
              disabled={updateQty.isPending}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{line.quantity}</span>
            <button
              onClick={() => updateQty.mutate({ id: line.id, quantity: line.quantity + 1 })}
              className="h-8 w-8 rounded-full transition-colors hover:bg-tint disabled:opacity-50"
              disabled={updateQty.isPending}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            onClick={() => removeFromCart.mutate(line.id)}
            className="text-xs text-muted underline transition-colors hover:text-plum"
            disabled={removeFromCart.isPending}
          >
            Remove
          </button>
        </div>

        <label className="mt-3 flex items-center gap-2 text-xs text-ink">
          <input
            type="checkbox"
            checked={line.gift_wrap}
            onChange={(e) => {
              const next = e.target.checked
              setShowMessage(next)
              toggleGift.mutate({
                id: line.id,
                gift_wrap: next,
                gift_message: next ? message : null,
              })
            }}
            className="accent-pink"
          />
          Gift wrap (free)
        </label>

        {showMessage && (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 150))}
            onBlur={() =>
              toggleGift.mutate({ id: line.id, gift_wrap: true, gift_message: message })
            }
            placeholder="Gift message (optional, max 150 chars)"
            rows={2}
            className="mt-2 w-full rounded-control border border-line p-2 text-xs focus:border-pink focus:outline-none"
          />
        )}
      </div>
    </li>
  )
}
