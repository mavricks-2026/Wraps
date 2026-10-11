import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatINR } from '@goodsly/utils'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return (<div className="px-4 py-20 text-center"><p>Please sign in.</p></div>)
  const { data: order } = await supabase.from('orders').select('id, order_number, status, total').eq('id', params.id).eq('user_id', user.id).maybeSingle()
  if (!order) notFound()
  return (
    <div>
      <h1 className="font-display text-h2 font-semibold text-ink">{order.order_number}</h1>
      <p className="text-body-sm text-muted">Status: {order.status} Total {formatINR(order.total)}</p>
      <Link href="/account/orders" className="mt-6 inline-block text-sm underline">All orders</Link>
    </div>
  )
}
