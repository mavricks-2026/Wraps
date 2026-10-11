'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { formatINR } from '@goodsly/utils'
import { useCart } from '@/lib/use-cart'
import type { Address } from '@/lib/use-addresses'
import { placeOrder } from './actions'
export function CheckoutClient({ addresses, userEmail }: { addresses: Address[]; userEmail: string }) {
  const router = useRouter()
  const { data: cart, isLoading } = useCart()
  const [addressId, setAddressId] = useState(addresses.find((a) => a.is_default)?.id ?? addresses[0]?.id ?? '')
  const [method, setMethod] = useState<'cod' | 'online'>('cod')
  const [coupon, setCoupon] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const subtotal = useMemo(() => cart?.reduce((s, l) => s + l.quantity * l.product_variants.price, 0) ?? 0, [cart])
  if (isLoading) return <p className="text-sm text-muted">Loading…</p>
  if (!cart || cart.length === 0) return (<div className="text-center py-14"><p>Your cart is empty.</p><Link href="/shop">Continue shopping</Link></div>)
  async function handlePlace() {
    setError(null)
    if (!addressId) { setError('Please select a delivery address.'); return }
    setPending(true)
    try {
      const result = await placeOrder({ addressId, paymentMethod: method, couponCode: coupon.trim() || undefined })
      if (!result.ok) { setError(result.error); setPending(false); return }
      router.push('/checkout/success?order=' + encodeURIComponent(result.orderNumber))
    } catch { setError('Something went wrong.'); setPending(false) }
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-card border border-line bg-surface p-6 shadow-card">
          <h2 className="mb-4 text-xs uppercase tracking-wider text-muted">Delivery address ({userEmail})</h2>
          {addresses.map((a) => (
            <label key={a.id} className="flex gap-3 border-b border-line py-3 text-sm">
              <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
              <span>{a.full_name} · {a.city} {a.pincode}</span>
            </label>
          ))}
        </section>
        <section className="rounded-card border border-line bg-surface p-6 shadow-card">
          <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code (optional)" />
        </section>
      </div>
      <aside className="h-fit rounded-card border border-line bg-surface p-6 shadow-card">
        <p className="font-display text-h3 text-plum">{formatINR(subtotal)}</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <Button size="lg" className="mt-4 w-full" onClick={handlePlace} disabled={pending}>{pending ? 'Placing order…' : 'Place order'}</Button>
      </aside>
    </div>
  )
}