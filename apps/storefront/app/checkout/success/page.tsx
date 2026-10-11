import Link from 'next/link'
import Image from 'next/image'
import { formatINR } from '@goodsly/utils'
import { Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { order?: string }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

interface VariantImage {
  url: string
  is_primary: boolean | null
  sort_order: number | null
}

interface OrderItemRow {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  gift_wrap: boolean
  is_free_gift: boolean
  product_variants: {
    sku: string
    color: string | null
    size: string | null
    products:
      | { name: string; slug: string; product_images: VariantImage[] }
      | { name: string; slug: string; product_images: VariantImage[] }[]
      | null
  } | null
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function primaryImage(images: VariantImage[] | undefined): string | null {
  if (!images || images.length === 0) return null
  const primary = images.find((img) => img.is_primary)
  if (primary) return primary.url
  return [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null
}

function Fallback({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="mb-3 font-display text-h1 font-semibold text-ink">
        We couldn&apos;t find that order
      </h1>
      <p className="mb-8 text-body-sm text-muted">{message}</p>
      <Link
        href="/account/orders"
        className="inline-flex h-12 items-center justify-center rounded-full border border-pink px-8 text-sm font-semibold text-plum transition-colors hover:bg-tint"
      >
        View all orders
      </Link>
    </div>
  )
}

export default async function OrderSuccessPage({ searchParams }: PageProps) {
  const orderNumber = searchParams.order

  if (!orderNumber) {
    return <Fallback message="No order reference was provided." />
  }

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Fallback message="Please sign in to view your order confirmation." />
    )
  }

  const { data: order } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, is_gift, gift_message, cod_requested,
       subtotal, discount_amt, shipping_fee, total, placed_at,
       addresses:addresses(full_name, phone, line1, line2, city, state, pincode, country),
       payments:payments(method, status, is_cod, amount),
       order_items(
         id, quantity, unit_price, total_price, gift_wrap, is_free_gift,
         product_variants(sku, color, size, products(name, slug, product_images(url, is_primary, sort_order)))
       )`,
    )
    .eq('order_number', orderNumber)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!order) {
    return (
      <Fallback message="This order doesn't exist or doesn't belong to your account." />
    )
  }

  const address = one(order.addresses) as
    | {
        full_name: string
        phone: string
        line1: string
        line2: string | null
        city: string
        state: string
        pincode: string
        country: string
      }
    | null
  const payment = one(order.payments) as
    | { method: string; status: string; is_cod: boolean; amount: number }
    | null
  const items = (order.order_items ?? []) as unknown as OrderItemRow[]

  const isCod = payment?.method === 'cod' || order.cod_requested

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card md:px-10">
        <span className="msym msym-filled mx-auto mb-5 block text-[56px] text-pink" aria-hidden>
          check_circle
        </span>
        <Badge tone="new" className="mb-4">
          {STATUS_LABELS[order.status as string] ?? (order.status as string)}
        </Badge>
        <h1 className="mb-3 font-display text-h1 font-semibold text-ink">
          Thank you for your order
        </h1>
        <p className="mx-auto max-w-lg text-body-sm text-muted">
          A confirmation has been recorded. Order{' '}
          <span className="font-semibold text-ink">{order.order_number as string}</span>
          {' '}placed on{' '}
          {new Date(order.placed_at as string).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
          .
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white transition-colors hover:bg-plum"
          >
            Continue shopping
          </Link>
        </div>
      </div>

      {/* Items */}
      <section className="mt-6 rounded-card border border-line bg-surface shadow-card">
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-display text-base font-semibold text-ink">Items ({items.length})</h2>
        </div>
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const variant = item.product_variants
            const product = one(variant?.products)
            const image = primaryImage(product?.product_images)
            return (
              <li key={item.id} className="flex gap-4 px-6 py-4">
                <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-image bg-tint">
                  {image ? (
                    <Image
                      src={image}
                      alt={product?.name ?? 'Product'}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{product?.name ?? '—'}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {[variant?.color, variant?.size].filter(Boolean).join(' · ')}
                    {item.gift_wrap && ' · Gift wrapped'}
                    {item.is_free_gift && ' · Free gift'}
                  </p>
                  <p className="mt-1 text-xs text-muted">Qty {item.quantity}</p>
                </div>
                <div className="text-right text-sm font-semibold text-plum tabular">
                  {formatINR(item.total_price)}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Totals */}
        <section className="space-y-2 rounded-card border border-line bg-surface p-6 text-sm">
          <h3 className="mb-3 text-xs uppercase tracking-wider text-muted">Summary</h3>
          <Row label="Subtotal" value={formatINR(order.subtotal as number)} />
          {(order.discount_amt as number) > 0 && (
            <Row label="Discount" value={`− ${formatINR(order.discount_amt as number)}`} />
          )}
          <Row
            label="Shipping"
            value={
              (order.shipping_fee as number) > 0
                ? formatINR(order.shipping_fee as number)
                : 'Free'
            }
          />
          <div className="border-t border-line pt-3">
            <Row label="Total" value={formatINR(order.total as number)} bold />
          </div>
          <div className="mt-1 border-t border-line pt-3">
            <p className="mb-1 text-xs uppercase tracking-wider text-muted">Payment</p>
            <p className="font-semibold text-ink">
              {isCod ? 'Cash on Delivery' : 'Paid online'}
              {payment && !isCod && payment.status ? ` · ${payment.status}` : ''}
            </p>
          </div>
        </section>

        {/* Shipping address */}
        {address && (
          <section className="rounded-card border border-line bg-surface p-6">
            <h3 className="mb-3 text-xs uppercase tracking-wider text-muted">Shipping to</h3>
            <p className="font-semibold text-ink">{address.full_name}</p>
            <p className="text-sm text-muted">{address.phone}</p>
            <address className="mt-2 text-sm not-italic text-muted">
              {address.line1}
              {address.line2 && (
                <>
                  <br />
                  {address.line2}
                </>
              )}
              <br />
              {address.city}, {address.state} {address.pincode}
              <br />
              {address.country}
            </address>
          </section>
        )}
      </div>

      {order.is_gift && order.gift_message && (
        <section className="mt-6 rounded-card border border-line bg-tint p-6">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-plum">Gift message</h3>
          <p className="text-sm italic text-ink">&ldquo;{order.gift_message as string}&rdquo;</p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/account/orders"
          className="inline-flex h-12 items-center justify-center rounded-full border border-pink px-8 text-sm font-semibold text-plum transition-colors hover:bg-tint"
        >
          View all orders
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={
        bold ? 'flex justify-between font-display text-h3 text-ink' : 'flex justify-between text-sm text-muted'
      }
    >
      <span>{label}</span>
      <span className="tabular text-plum">{value}</span>
    </div>
  )
}
