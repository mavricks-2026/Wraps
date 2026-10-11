import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatINR } from '@goodsly/utils'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'
import { StatusActions } from './StatusActions'
import type { OrderStatus } from '@/types/db'

export const dynamic = 'force-dynamic'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
}

interface PageProps {
  params: { id: string }
}

export default async function OrderDetailPage({ params }: PageProps) {
  const supabase = getAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select(
      `id, order_number, status, is_gift, gift_message, cod_requested,
       subtotal, discount_amt, shipping_fee, total, placed_at,
       awb_code, shiprocket_order_id,
       profiles:profiles(full_name, phone),
       addresses:addresses(full_name, phone, line1, line2, city, state, pincode, country),
       payments:payments(method, status, transaction_id, is_cod, paid_at, amount),
       order_items(
         id, quantity, unit_price, total_price, gift_wrap, is_free_gift,
         product_variants(sku, color, size, products(name, slug))
       ),
       order_status_logs(id, status, note, created_at)`,
    )
    .eq('id', params.id)
    .maybeSingle()

  if (!order) notFound()

  const status = order.status as OrderStatus
  const profile = (Array.isArray(order.profiles) ? order.profiles[0] : order.profiles) as
    | { full_name: string | null; phone: string | null }
    | null
  const address = (Array.isArray(order.addresses) ? order.addresses[0] : order.addresses) as
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
  const payment = (Array.isArray(order.payments) ? order.payments[0] : order.payments) as
    | { method: string; status: string; transaction_id: string | null; is_cod: boolean; paid_at: string | null; amount: number }
    | null
  const items = (order.order_items ?? []) as unknown as Array<{
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
      products: { name: string; slug: string } | { name: string; slug: string }[]
    } | null
  }>
  const logs = (order.order_status_logs ?? []) as unknown as Array<{
    id: string
    status: string
    note: string | null
    created_at: string
  }>

  return (
    <>
      <PageHeader
        title={order.order_number as string}
        description={`Placed ${new Date(order.placed_at as string).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`}
        action={
          <Link
            href="/orders"
            className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900"
          >
            ← All orders
          </Link>
        }
      />

      <div className="px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status + actions */}
          <section className="bg-white border border-stone-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-stone-500">Status</span>
              <OrderStatusBadge status={status} />
              {order.is_gift && (
                <span className="text-[10px] uppercase tracking-wider text-pink-700">Gift</span>
              )}
              {order.cod_requested && (
                <span className="text-[10px] uppercase tracking-wider text-amber-700">COD</span>
              )}
            </div>
            <StatusActions
              orderId={order.id as string}
              current={status}
              allowed={VALID_TRANSITIONS[status]}
            />
          </section>

          {/* Items */}
          <section className="bg-white border border-stone-200">
            <div className="px-5 py-3 border-b border-stone-200">
              <h2 className="font-medium">Items ({items.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-600">
                <tr className="text-left">
                  <th className="px-5 py-2 font-medium">Product</th>
                  <th className="px-5 py-2 font-medium">SKU</th>
                  <th className="px-5 py-2 font-medium">Qty</th>
                  <th className="px-5 py-2 font-medium text-right">Price</th>
                  <th className="px-5 py-2 font-medium text-right">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {items.map((item) => {
                  const variant = item.product_variants
                  const productMaybe = variant?.products
                  const product = Array.isArray(productMaybe) ? productMaybe[0] : productMaybe
                  return (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <div className="font-medium">{product?.name ?? '—'}</div>
                        <div className="text-xs text-stone-500">
                          {[variant?.color, variant?.size].filter(Boolean).join(' · ')}
                          {item.gift_wrap && ' · 🎁 gift wrapped'}
                          {item.is_free_gift && ' · FREE GIFT'}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-stone-600">{variant?.sku ?? '—'}</td>
                      <td className="px-5 py-3 tabular">{item.quantity}</td>
                      <td className="px-5 py-3 tabular text-right">{formatINR(item.unit_price)}</td>
                      <td className="px-5 py-3 tabular text-right">
                        {formatINR(item.total_price)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* Timeline */}
          <section className="bg-white border border-stone-200 p-5">
            <h2 className="font-medium mb-4">Timeline</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-stone-500">No status changes yet.</p>
            ) : (
              <ol className="space-y-3">
                {logs
                  .slice()
                  .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                  .map((log) => (
                    <li key={log.id} className="flex gap-3 text-sm">
                      <OrderStatusBadge status={log.status as OrderStatus} className="mt-0.5" />
                      <div className="flex-1">
                        <p className="text-stone-600">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                        {log.note && <p className="text-stone-700 mt-1">{log.note}</p>}
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-white border border-stone-200 p-5">
            <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-3">Customer</h3>
            <p className="font-medium">{profile?.full_name ?? '—'}</p>
            {profile?.phone && <p className="text-sm text-stone-600">{profile.phone}</p>}
          </section>

          {address && (
            <section className="bg-white border border-stone-200 p-5">
              <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-3">Ship to</h3>
              <p className="font-medium">{address.full_name}</p>
              <p className="text-sm text-stone-600">{address.phone}</p>
              <address className="not-italic text-sm text-stone-700 mt-2">
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

          <section className="bg-white border border-stone-200 p-5 space-y-2 text-sm">
            <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-3">Totals</h3>
            <Row label="Subtotal" value={formatINR(order.subtotal as number)} />
            {(order.discount_amt as number) > 0 && (
              <Row label="Discount" value={`− ${formatINR(order.discount_amt as number)}`} />
            )}
            <Row label="Shipping" value={formatINR(order.shipping_fee as number)} />
            <div className="border-t border-stone-200 pt-2">
              <Row label="Total" value={formatINR(order.total as number)} bold />
            </div>
          </section>

          {payment && (
            <section className="bg-white border border-stone-200 p-5">
              <h3 className="text-xs uppercase tracking-wider text-stone-500 mb-3">Payment</h3>
              <p className="text-sm">
                <span className="capitalize">{payment.method}</span> ·{' '}
                <span className="capitalize">{payment.status}</span>
              </p>
              {payment.transaction_id && (
                <p className="text-xs text-stone-500 break-all mt-1">{payment.transaction_id}</p>
              )}
            </section>
          )}

          {order.is_gift && order.gift_message && (
            <section className="bg-pink-50 border border-pink-200 p-5">
              <h3 className="text-xs uppercase tracking-wider text-pink-700 mb-2">Gift message</h3>
              <p className="text-sm text-stone-700 italic">"{order.gift_message as string}"</p>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-medium' : 'text-stone-600'}`}>
      <span>{label}</span>
      <span className="tabular">{value}</span>
    </div>
  )
}
