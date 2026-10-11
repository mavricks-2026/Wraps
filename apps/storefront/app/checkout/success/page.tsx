import Link from 'next/link'
import { formatINR } from '@goodsly/utils'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export default async function OrderSuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  const orderNumber = searchParams.order
  if (!orderNumber) return (<div className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="font-display text-h1 font-semibold">Order not found</h1></div>)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return (<div className="mx-auto max-w-2xl px-4 py-20 text-center"><p>Please sign in to view your order.</p></div>)
  const { data: order } = await supabase.from('orders').select('id, order_number, status, subtotal, discount_amt, shipping_fee, total, placed_at').eq('order_number', orderNumber).eq('user_id', user.id).maybeSingle()
  if (!order) return (<div className="mx-auto max-w-2xl px-4 py-20 text-center"><h1 className="font-display text-h1 font-semibold">Order not found</h1></div>)
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
        <h1 className="mb-3 font-display text-h1 font-semibold text-ink">Thank you for your order</h1>
        <p className="text-body-sm text-muted">Order <span className="font-semibold text-ink">{order.order_number}</span> · Total {formatINR(order.total)}</p>
        <div className="mt-8"><Link href="/" className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white">Continue shopping</Link></div>
      </div>
      <div className="mt-8 text-center"><Link href="/account/orders" className="text-sm font-semibold text-plum underline">View all orders</Link></div>
    </div>
  )
}