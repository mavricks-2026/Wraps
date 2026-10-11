import Link from 'next/link'
import { formatINR, cn } from '@goodsly/utils'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'
import type { OrderStatus } from '@/types/db'

export const dynamic = 'force-dynamic'

const STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]

interface PageProps {
  searchParams: { status?: string; q?: string }
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const supabase = getAdminClient()
  const status = searchParams.status as OrderStatus | undefined
  const q = searchParams.q?.trim()

  let query = supabase
    .from('orders')
    .select(
      'id, order_number, status, is_gift, cod_requested, total, placed_at, profiles(full_name, phone)',
    )
    .order('placed_at', { ascending: false })
    .limit(100)

  if (status && STATUSES.includes(status)) {
    query = query.eq('status', status)
  }
  if (q) {
    query = query.ilike('order_number', `%${q}%`)
  }

  const { data: orders, error } = await query

  return (
    <>
      <PageHeader title="Orders" description="Manage customer orders and fulfilment." />

      <div className="px-8 py-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill href="/orders" active={!status}>All</FilterPill>
          {STATUSES.map((s) => (
            <FilterPill
              key={s}
              href={`/orders?status=${s}`}
              active={status === s}
            >
              {s}
            </FilterPill>
          ))}

          <form className="ml-auto" action="/orders">
            {status && <input type="hidden" name="status" value={status} />}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search order #"
              className="h-9 px-3 text-sm border border-stone-300 bg-white focus:border-stone-900 focus:outline-none"
            />
          </form>
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
            Failed to load orders: {error.message}
          </p>
        ) : !orders || orders.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-white border border-stone-200">
            No orders match these filters.
          </p>
        ) : (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {orders.map((o) => {
                  const profile = (Array.isArray(o.profiles) ? o.profiles[0] : o.profiles) as
                    | { full_name: string | null; phone: string | null }
                    | null
                    | undefined
                  return (
                    <tr key={o.id as string} className="hover:bg-stone-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/orders/${o.id}`}
                          className="text-stone-900 font-medium hover:underline"
                        >
                          {o.order_number as string}
                        </Link>
                        <div className="flex gap-1.5 mt-1">
                          {o.is_gift && (
                            <span className="text-[10px] uppercase tracking-wider text-pink-700">
                              Gift
                            </span>
                          )}
                          {o.cod_requested && (
                            <span className="text-[10px] uppercase tracking-wider text-amber-700">
                              COD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-stone-700">
                        {profile?.full_name ?? '—'}
                        {profile?.phone && (
                          <div className="text-xs text-stone-500">{profile.phone}</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={o.status as OrderStatus} />
                      </td>
                      <td className="px-5 py-3 tabular">{formatINR(o.total as number)}</td>
                      <td className="px-5 py-3 text-stone-600">
                        {new Date(o.placed_at as string).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'px-3 py-1.5 text-xs uppercase tracking-wider border transition-colors',
        active
          ? 'bg-stone-900 text-white border-stone-900'
          : 'bg-white border-stone-300 text-stone-700 hover:border-stone-900',
      )}
    >
      {children}
    </Link>
  )
}
