'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { formatINR, cn } from '@goodsly/utils'
import { useCart } from '@/lib/use-cart'
import type { Address } from '@/lib/use-addresses'
import { placeOrder } from './actions'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Razorpay?: any
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export function CheckoutClient({
  addresses,
  userEmail,
}: {
  addresses: Address[]
  userEmail: string
}) {
  const router = useRouter()
  const { data: cart, isLoading } = useCart()
  const [addressId, setAddressId] = useState(addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? '')
  const [method, setMethod] = useState<'cod' | 'online'>('cod')
  const [coupon, setCoupon] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subtotal = useMemo(
    () => cart?.reduce((s, l) => s + l.quantity * l.product_variants.price, 0) ?? 0,
    [cart],
  )

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>

  if (!cart || cart.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-card border border-line bg-surface px-6 py-14 text-center shadow-card">
        <span className="msym msym-filled mx-auto block text-[40px] text-pink" aria-hidden>
          shopping_bag
        </span>
        <p className="font-display text-h3 font-semibold text-ink">Your cart is empty.</p>
        <Link href="/collections/bags">
          <Button variant="outline">Continue shopping</Button>
        </Link>
      </div>
    )
  }

  async function handlePlace() {
    setError(null)
    if (!addressId) {
      setError('Please add and select a delivery address.')
      return
    }
    setPending(true)
    try {
      const result = await placeOrder({
        addressId,
        paymentMethod: method,
        couponCode: coupon.trim() || undefined,
        giftMessage: giftMessage.trim() || undefined,
      })
      if (!result.ok) {
        setError(result.error)
        setPending(false)
        return
      }
      if (result.mode === 'cod') {
        router.push(`/checkout/success?order=${encodeURIComponent(result.orderNumber)}`)
        return
      }
      // Online — open Razorpay.
      const loaded = await loadRazorpay()
      if (!loaded || !window.Razorpay) {
        setError('Could not load the payment window. Please try again or use COD.')
        setPending(false)
        return
      }
      const rzp = new window.Razorpay({
        key: result.razorpay.keyId,
        amount: result.razorpay.amount,
        currency: result.razorpay.currency,
        order_id: result.razorpay.orderId,
        name: 'WrapUrs',
        description: `Order ${result.orderNumber}`,
        prefill: { email: userEmail },
        theme: { color: '#B96CB4' },
        handler: async (resp: any) => {
          const v = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            }),
          })
          const data = await v.json().catch(() => ({ ok: false }))
          if (data.ok) {
            router.push(`/checkout/success?order=${encodeURIComponent(result.orderNumber)}`)
          } else {
            setError('Payment could not be verified. If you were charged, contact support.')
            setPending(false)
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment was cancelled. Your order is on hold — try again.')
            setPending(false)
          },
        },
      })
      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
      setPending(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
      {/* Left: address + payment */}
      <div className="space-y-6">
        <section className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-xs uppercase tracking-wider text-muted">Delivery address</h2>
          {addresses.length === 0 ? (
            <div className="space-y-3 rounded-control border border-line bg-tint p-4 text-sm text-muted">
              <p>You have no saved addresses yet.</p>
              <Link href="/account/addresses">
                <Button variant="outline" size="sm">
                  Add an address
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-control border p-4 text-sm transition-colors',
                    addressId === a.id ? 'border-pink bg-pink-wash' : 'border-line hover:border-pink/50',
                  )}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                    className="mt-1 accent-pink"
                  />
                  <span>
                    <span className="font-semibold text-ink">{a.full_name}</span>{' '}
                    <span className="text-muted">· {a.phone}</span>
                    <br />
                    <span className="text-muted">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                    </span>
                    {a.is_default && <span className="ml-2 text-xs text-muted">(default)</span>}
                  </span>
                </label>
              ))}
              <Link
                href="/account/addresses"
                className="inline-block text-xs text-muted underline transition-colors hover:text-plum"
              >
                Manage addresses
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-xs uppercase tracking-wider text-muted">Payment</h2>
          <div className="space-y-2 text-sm">
            <label
              className={cn(
                'flex cursor-pointer gap-3 rounded-control border p-4 transition-colors',
                method === 'cod' ? 'border-pink bg-pink-wash' : 'border-line hover:border-pink/50',
              )}
            >
              <input
                type="radio"
                name="pay"
                checked={method === 'cod'}
                onChange={() => setMethod('cod')}
                className="mt-1 accent-pink"
              />
              <span>
                <span className="font-semibold text-ink">Cash on Delivery</span>
                <br />
                <span className="text-xs text-muted">Pay in cash when your order arrives.</span>
              </span>
            </label>
            <label
              className={cn(
                'flex cursor-pointer gap-3 rounded-control border p-4 transition-colors',
                method === 'online' ? 'border-pink bg-pink-wash' : 'border-line hover:border-pink/50',
              )}
            >
              <input
                type="radio"
                name="pay"
                checked={method === 'online'}
                onChange={() => setMethod('online')}
                className="mt-1 accent-pink"
              />
              <span>
                <span className="font-semibold text-ink">Pay online</span>
                <br />
                <span className="text-xs text-muted">UPI, cards, netbanking via Razorpay.</span>
              </span>
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-card border border-line bg-surface p-6 shadow-card">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted">
              Coupon code (optional)
            </label>
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="e.g. WELCOME"
              className="max-w-xs"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-muted">
              Gift message (optional)
            </label>
            <Input
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value.slice(0, 150))}
              placeholder="Add a note…"
            />
          </div>
        </section>
      </div>

      {/* Right: order summary */}
      <aside className="h-fit space-y-4 rounded-card border border-line bg-surface p-6 shadow-card lg:sticky lg:top-24">
        <h2 className="font-display text-h2 font-semibold text-ink">Order summary</h2>
        <ul className="divide-y divide-line text-sm">
          {cart.map((l) => (
            <li key={l.id} className="flex justify-between gap-3 py-2">
              <span className="text-muted">
                {l.product_variants.products.name}
                {l.product_variants.color ? ` · ${l.product_variants.color}` : ''} × {l.quantity}
              </span>
              <span className="font-semibold text-plum">
                {formatINR(l.quantity * l.product_variants.price)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="font-display text-h3 text-plum">{formatINR(subtotal)}</span>
        </div>
        <p className="text-xs text-muted">
          Shipping is free across India. Coupon discounts are applied when you place the order.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button size="lg" className="w-full" onClick={handlePlace} disabled={pending || !addressId}>
          {pending ? 'Placing order…' : method === 'cod' ? 'Place order (COD)' : 'Pay & place order'}
        </Button>
      </aside>
    </div>
  )
}
