import Link from 'next/link'
import { formatINR } from '@goodsly/utils'
import { Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
const STATUS_LABELS: Record<string, string> = { pending: 'Order placed', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', returned: 'Returned' }
function statusTone(status: string): 'neutral' | 'sale' | 'new' | 'low-stock' {
  switch (status) {
    case 'delivered': return 'new'
    case 'shipped': case 'packed': case 'confirmed': return 'low-stock'
    case 'cancelled': case 'returned': return 'sale'
    default: return 'neutral'
  }
}
interface OrderRow { id: string; order_number: string; status: string; total: number; placed_at: string; order_items: { id: string }[] }
export default async function OrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="mb-3 font-display text-h2 font-semibold text-ink">Your orders</h1>
        <p className="mb-8 text-body-sm text-muted">Please sign in to view your orders.</p>
        <Link href="/sign-in?redirect=/account/orders" className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-plum hover:shadow-none">Sign in</Link>
      </div>
    )
  }
  const { data } = await supabase.from('orders').select('id, order_number, status, total, placed_at, order_items(id)').eq('user_id', user.id).order('placed_at', { ascending: false })
  const orders = (data ?? []) as unknown as OrderRow[]
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-display text-h2 font-semibold text-ink">Your orders</h2>
        <p className="text-body-sm text-muted">Every keepsake you have sent, in one place.</p>
      </div>
      {orders.length === 0 ? (
        <div className="rounded-card border border-line bg-surface px-6 py-14 text-center shadow-card">
          <h3 className="font-display text-lg font-semibold text-ink">No orders yet</h3>
          <p className="mt-1 text-body-sm text-muted">You have not placed any orders yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={'/account/orders/' + order.id} className="flex items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4 shadow-card">
                <p className="font-display font-semibold text-ink">{order.order_number}</p>
                <div className="flex items-center gap-4">
                  <Badge tone={statusTone(order.status)}>{STATUS_LABELS[order.status] ?? order.status}</Badge>
                  <span className="text-sm tabular text-plum">{formatINR(order.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}