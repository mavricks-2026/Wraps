import Link from 'next/link'
import { formatINR } from '@goodsly/utils'
import { Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
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

interface OrderRow {
  id: string
  order_number: string
  status: string
  total: number
  placed_at: string
  order_items: { id: string }[]
}

export default async function OrdersPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="mb-3 font-display text-h2 font-semibold text-ink">Your orders</h1>
        <p className="mb-8 text-body-sm text-muted">Please sign in to view your orders.</p>
        <Link
          href="/sign-in?redirect=/account/orders"
          className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-plum hover:shadow-none"
        >
          Sign in
        </Link>
      </div>
    )
  }

  const { data } = await supabase
    .from('orders')
    .select('id, order_number, status, total, placed_at, order_items(id)')
    .eq('user_id', user.id)
    .order('placed_at', { ascending: false })

  const orders = (data ?? []) as unknown as OrderRow[]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-display text-h2 font-semibold text-ink">Your orders</h2>
        <p className="text-body-sm text-muted">Every keepsake you have sent, in one place.</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-card border border-line bg-surface px-6 py-14 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soft">
            <span className="msym msym-filled text-[28px] text-pink" aria-hidden>
              shopping_bag
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-ink">No orders yet</h3>
          <p className="mt-1 text-body-sm text-muted">You haven&apos;t placed any orders yet.</p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-plum hover:shadow-none"
            >
              Start shopping
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.order_items?.length ?? 0
            return (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div>
                    <p className="font-display font-semibold text-ink">{order.order_number}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(order.placed_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                      })}
                      {' · '}
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge tone={statusTone(order.status)}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                    <span className="text-sm tabular text-plum">{formatINR(order.total)}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
