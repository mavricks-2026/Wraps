import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { formatINR } from '@goodsly/utils'
import { Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order placed',
  confirmed: 'Order confirmed',
  packed: 'Packed & ready',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

function statusTone(status: string): 'neutral' | 'sale' | 'new' | 'low-stock' {
  switch (status) {
    case 'delivered':
      return 'new'
    case 'shipped':
    case 'packed':
    case 'confirmed':
      return 'low-stock'
    case 'cancelled':
    case 'returned':
      return 'sale'
    default:
      return 'neutral'
  }
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

interface StatusLogRow {
  id: string
  status: string
  note: string | null
  created_at: string
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

export default async function OrderDetailPage({ params }: PageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="mb-3 font-display text-h2 font-semibold text-ink">Order</h1>
        <p className="mb-8 text-body-sm text-muted">Please sign in to view this order.</p>
        <Link
          href={`/sign-in?redirect=/account/orders/${params.id}`}
          className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-plum hover:shadow-none"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const { data: order } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, is_gift, gift_message, cod_requested,
       subtotal, discount_amt, shipping_fee, total, placed_at, awb_code,
       addresses:addresses(full_name, phone, line1, line2, city, state, pincode, country),
       payments:payments(method, status, is_cod, amount),
       order_items(
         id, quantity, unit_price, total_price, gift_wrap, is_free_gift,
         product_variants(sku, color, size, products(name, slug, product_images(url, is_primary, sort_order)))
       ),
       order_status_logs(id, status, note, created_at)`,
    )
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!order) notFound()

  const status = order.status as string
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
  const logs = ((order.order_status_logs ?? []) as unknown as StatusLogRow[])
    .slice()
    .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))

  const isCod = payment?.method === 'cod' || order.cod_requested

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-h2 font-semibold text-ink">
            {order.order_number as string}
          </h1>
          <p className="mt-1 text-xs text-muted">
            Placed{' '}
            {new Date(order.placed_at as string).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
        <Link
          href="/account/orders"
          className="text-xs uppercase tracking-wider text-muted transition-colors hover:text-plum"
        >
          ← All orders
        </Link>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-muted">Status</span>
        <Badge tone={statusTone(status)}>{STATUS_LABELS[status] ?? status}</Badge>
        {order.awb_code && <span className="text-xs text-muted">AWB {order.awb_code as string}</span>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <section className="rounded-card border border-line bg-surface shadow-card">
            <div className="border-b border-line px-6 py-4">
              <h2 className="font-display font-semibold text-ink">Items ({items.length})</h2>
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
                      <p className="font-display font-semibold text-ink">{product?.name ?? '—'}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {[variant?.color, variant?.size].filter(Boolean).join(' · ')}
                        {item.gift_wrap && ' · Gift wrapped'}
                        {item.is_free_gift && ' · Free gift'}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Qty {item.quantity} · {formatINR(item.unit_price)} each
                      </p>
                    </div>
                    <div className="text-right text-body-sm tabular text-ink">
                      {formatINR(item.total_price)}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Status timeline */}
          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h2 className="mb-4 font-display font-semibold text-ink">Tracking</h2>
            {logs.length === 0 ? (
              <p className="text-body-sm text-muted">No tracking updates yet.</p>
            ) : (
              <ol className="relative ml-1.5 border-l border-line">
                {logs.map((log) => (
                  <li key={log.id} className="ml-5 pb-5 last:pb-0">
                    <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-pink" />
                    <p className="text-sm font-display font-semibold text-ink">
                      {STATUS_LABELS[log.status] ?? log.status}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    {log.note && <p className="mt-1 text-body-sm text-ink">{log.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {address && (
            <section className="rounded-card border border-line bg-surface p-6 shadow-card">
              <h3 className="mb-3 text-xs uppercase tracking-wider text-muted">Shipping to</h3>
              <p className="font-display font-semibold text-ink">{address.full_name}</p>
              <p className="text-body-sm text-muted">{address.phone}</p>
              <address className="mt-2 not-italic text-body-sm text-ink">
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

          <section className="space-y-2 rounded-card border border-line bg-surface p-6 text-body-sm shadow-card">
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
            <div className="border-t border-line pt-2">
              <Row label="Total" value={formatINR(order.total as number)} bold />
            </div>
          </section>

          <section className="rounded-card border border-line bg-surface p-6 shadow-card">
            <h3 className="mb-3 text-xs uppercase tracking-wider text-muted">Payment</h3>
            <p className="text-body-sm text-ink">{isCod ? 'Cash on Delivery' : 'Paid online'}</p>
            {payment && <p className="mt-1 text-xs capitalize text-muted">{payment.status}</p>}
          </section>

          {order.is_gift && order.gift_message && (
            <section className="rounded-card border border-line bg-soft p-6 shadow-card">
              <h3 className="mb-2 text-xs uppercase tracking-wider text-plum">Gift message</h3>
              <p className="text-body-sm italic text-ink">
                &ldquo;{order.gift_message as string}&rdquo;
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-display font-semibold text-ink' : 'text-muted'}`}>
      <span>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  )
}
