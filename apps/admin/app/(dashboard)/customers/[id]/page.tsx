import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatINR } from '@goodsly/utils'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@goodsly/ui'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'
import { ActiveToggle } from '../ActiveToggle'
import type { OrderStatus } from '@/types/db'

export const dynamic = 'force-dynamic'

type Role = 'customer' | 'admin' | 'staff'

const ROLE_TONES: Record<Role, 'neutral' | 'new' | 'sale'> = {
  customer: 'neutral',
  staff: 'new',
  admin: 'sale',
}

interface PageProps {
  params: { id: string }
}

export default async function CustomerDetailPage({ params }: PageProps) {
  await requireAdmin()
  const supabase = getAdminClient()

  const [{ data: profile }, authUserResult, { data: orders }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, avatar_url, role, is_active, created_at')
      .eq('id', params.id)
      .maybeSingle(),
    // Single-user email lookup via service role (no pagination needed here).
    supabase.auth.admin.getUserById(params.id),
    supabase
      .from('orders')
      .select('id, order_number, status, total, placed_at')
      .eq('user_id', params.id)
      .order('placed_at', { ascending: false }),
  ])

  if (!profile) notFound()

  const role = profile.role as Role
  const email = authUserResult.data?.user?.email ?? null
  const orderRows = (orders ?? []) as Array<{
    id: string
    order_number: string
    status: OrderStatus
    total: number
    placed_at: string
  }>
  const lifetimeSpend = orderRows.reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  return (
    <>
      <PageHeader
        title={(profile.full_name as string | null) ?? 'Customer'}
        description={email ?? 'No email on file'}
        action={
          <Link
            href="/customers"
            className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900"
          >
            ← All customers
          </Link>
        }
      />

      <div className="px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-stone-200">
            <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-medium">Orders ({orderRows.length})</h2>
              <span className="text-sm text-stone-600">
                Lifetime spend: <span className="tabular font-medium">{formatINR(lifetimeSpend)}</span>
              </span>
            </div>
            {orderRows.length === 0 ? (
              <p className="text-sm text-stone-500 py-12 text-center">
                This customer has no orders yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr className="text-left">
                    <th className="px-5 py-2 font-medium">Order</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                    <th className="px-5 py-2 font-medium text-right">Total</th>
                    <th className="px-5 py-2 font-medium">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {orderRows.map((o) => (
                    <tr key={o.id} className="hover:bg-stone-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/orders/${o.id}`}
                          className="text-stone-900 font-medium hover:underline"
                        >
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-5 py-3 tabular text-right">{formatINR(o.total)}</td>
                      <td className="px-5 py-3 text-stone-600">
                        {new Date(o.placed_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-stone-500">Profile</h3>
            <div className="flex items-center gap-2">
              <Badge tone={ROLE_TONES[role]}>{role}</Badge>
              {profile.is_active ? (
                <span className="text-xs uppercase tracking-wider text-emerald-700">Active</span>
              ) : (
                <span className="text-xs uppercase tracking-wider text-rose-700">Suspended</span>
              )}
            </div>
            <dl className="text-sm space-y-2">
              <Field label="Name" value={(profile.full_name as string | null) ?? '—'} />
              <Field label="Email" value={email ?? '—'} />
              <Field label="Phone" value={(profile.phone as string | null) ?? '—'} />
              <Field
                label="Joined"
                value={new Date(profile.created_at as string).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                })}
              />
            </dl>
          </section>

          <section className="bg-white border border-stone-200 p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-stone-500">Account status</h3>
            <ActiveToggle
              customerId={profile.id as string}
              isActive={Boolean(profile.is_active)}
              role={role}
            />
          </section>
        </div>
      </div>
    </>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-stone-900 text-right break-all">{value}</dd>
    </div>
  )
}
