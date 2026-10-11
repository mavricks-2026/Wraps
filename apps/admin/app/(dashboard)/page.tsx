import Link from 'next/link'
import { formatINR } from '@goodsly/utils'
import { getAdminClient } from '@/lib/supabase/admin'
import { KpiCard } from '@/components/KpiCard'
import { PageHeader } from '@/components/PageHeader'
import { RealtimeOrders } from '@/components/RealtimeOrders'
import type { Order } from '@/types/db'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = getAdminClient()

  // Today bounds (server tz, good enough for an internal dashboard)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayIso = todayStart.toISOString()

  const [
    { data: todayOrders },
    { data: pendingOrders },
    { data: lowStock },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total, status')
      .gte('placed_at', todayIso),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: false })
      .in('status', ['pending', 'confirmed', 'packed']),
    supabase
      .from('inventory')
      .select(
        'id, qty_available, qty_reserved, reorder_level, product_variants(sku, products(name))',
      )
      .order('qty_available', { ascending: true })
      .limit(5),
    supabase
      .from('orders')
      .select(
        'id, order_number, user_id, status, is_gift, cod_requested, subtotal, discount_amt, shipping_fee, total, placed_at',
      )
      .order('placed_at', { ascending: false })
      .limit(20),
  ])

  const todayCount = todayOrders?.length ?? 0
  const todayRevenue = (todayOrders ?? [])
    .filter((o: { status: string }) => o.status !== 'cancelled')
    .reduce((sum: number, o: { total: number }) => sum + Number(o.total), 0)
  const pendingCount = pendingOrders?.length ?? 0

  return (
    <>
      <PageHeader title="Dashboard" description="Live overview of today's activity." />

      <div className="px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Orders today"
            value={String(todayCount)}
            hint="Includes cancelled"
          />
          <KpiCard
            label="Revenue today"
            value={formatINR(todayRevenue)}
            hint="Excluding cancelled"
          />
          <KpiCard
            label="Open orders"
            value={String(pendingCount)}
            hint="Pending · confirmed · packed"
          />
        </div>

        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-serif text-2xl text-stone-900">Recent orders</h2>
            <Link
              href="/orders"
              className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900"
            >
              View all →
            </Link>
          </div>
          <RealtimeOrders initial={(recentOrders ?? []) as unknown as Order[]} />
        </section>

        <section>
          <h2 className="font-serif text-2xl text-stone-900 mb-3">Low stock</h2>
          {lowStock && lowStock.length > 0 ? (
            <div className="bg-white border border-stone-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                  <tr className="text-left">
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">SKU</th>
                    <th className="px-5 py-3 font-medium">Available</th>
                    <th className="px-5 py-3 font-medium">Reserved</th>
                    <th className="px-5 py-3 font-medium">Reorder at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {lowStock.map((row) => {
                    const variants = row.product_variants as
                      | { sku: string; products: { name: string }[] | { name: string } }
                      | { sku: string; products: { name: string }[] | { name: string } }[]
                      | null
                    const variant = Array.isArray(variants) ? variants[0] : variants
                    const productMaybe = variant?.products
                    const productObj = Array.isArray(productMaybe) ? productMaybe[0] : productMaybe
                    return (
                      <tr key={row.id as string} className="hover:bg-stone-50">
                        <td className="px-5 py-3">{productObj?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-stone-600">{variant?.sku ?? '—'}</td>
                        <td className="px-5 py-3 tabular">{row.qty_available as number}</td>
                        <td className="px-5 py-3 tabular text-stone-600">
                          {row.qty_reserved as number}
                        </td>
                        <td className="px-5 py-3 tabular text-stone-600">
                          {row.reorder_level as number}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-stone-500">All variants are stocked above their reorder level.</p>
          )}
        </section>
      </div>
    </>
  )
}
