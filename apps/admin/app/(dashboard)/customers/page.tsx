import Link from 'next/link'
import { formatINR, cn } from '@goodsly/utils'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@goodsly/ui'

export const dynamic = 'force-dynamic'

// auth.admin.listUsers returns one page at a time. The MVP fetches a single
// page at the max per-page size; customers beyond this won't get emails merged.
// Increase / paginate (loop incrementing `page`) once the base grows past this.
const AUTH_USERS_PER_PAGE = 1000

type Role = 'customer' | 'admin' | 'staff'
const ROLES: Role[] = ['customer', 'admin', 'staff']

interface PageProps {
  searchParams: { role?: string; active?: string; q?: string }
}

const ROLE_TONES: Record<Role, 'neutral' | 'new' | 'sale'> = {
  customer: 'neutral',
  staff: 'new',
  admin: 'sale',
}

export default async function CustomersPage({ searchParams }: PageProps) {
  await requireAdmin()
  const supabase = getAdminClient()

  const role = searchParams.role as Role | undefined
  const active = searchParams.active // 'true' | 'false' | undefined
  const q = searchParams.q?.trim()

  // 1) Profiles (with optional role/active filters applied in DB).
  let profileQuery = supabase
    .from('profiles')
    .select('id, full_name, phone, role, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (role && ROLES.includes(role)) profileQuery = profileQuery.eq('role', role)
  if (active === 'true') profileQuery = profileQuery.eq('is_active', true)
  if (active === 'false') profileQuery = profileQuery.eq('is_active', false)

  // 2) Auth users (for emails) + 3) order rows (for per-customer stats), in parallel.
  const [profilesResult, authResult, ordersResult] = await Promise.all([
    profileQuery,
    supabase.auth.admin.listUsers({ page: 1, perPage: AUTH_USERS_PER_PAGE }),
    supabase.from('orders').select('user_id, total'),
  ])

  const profiles = profilesResult.data ?? []
  const error = profilesResult.error

  // Merge email by id.
  const emailById = new Map<string, string>()
  for (const u of authResult.data?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email)
  }

  // Aggregate order count + lifetime spend by user.
  const statsById = new Map<string, { count: number; spend: number }>()
  for (const o of ordersResult.data ?? []) {
    const uid = o.user_id as string
    const prev = statsById.get(uid) ?? { count: 0, spend: 0 }
    prev.count += 1
    prev.spend += Number(o.total) || 0
    statsById.set(uid, prev)
  }

  // Build merged rows + apply name/email search (in memory — email lives in auth).
  const rows = profiles
    .map((p) => {
      const email = emailById.get(p.id as string) ?? null
      const stats = statsById.get(p.id as string) ?? { count: 0, spend: 0 }
      return {
        id: p.id as string,
        fullName: (p.full_name as string | null) ?? null,
        phone: (p.phone as string | null) ?? null,
        role: p.role as Role,
        isActive: Boolean(p.is_active),
        createdAt: p.created_at as string,
        email,
        orderCount: stats.count,
        spend: stats.spend,
      }
    })
    .filter((r) => {
      if (!q) return true
      const needle = q.toLowerCase()
      return (
        (r.fullName?.toLowerCase().includes(needle) ?? false) ||
        (r.email?.toLowerCase().includes(needle) ?? false)
      )
    })

  return (
    <>
      <PageHeader title="Customers" description="Browse customers, view orders, and manage account status." />

      <div className="px-8 py-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill href={buildHref({ active, q })} active={!role}>
            All roles
          </FilterPill>
          {ROLES.map((r) => (
            <FilterPill key={r} href={buildHref({ role: r, active, q })} active={role === r}>
              {r}
            </FilterPill>
          ))}

          <span className="mx-2 h-5 w-px bg-stone-300" />

          <FilterPill href={buildHref({ role, q })} active={!active}>
            Any status
          </FilterPill>
          <FilterPill href={buildHref({ role, active: 'true', q })} active={active === 'true'}>
            Active
          </FilterPill>
          <FilterPill href={buildHref({ role, active: 'false', q })} active={active === 'false'}>
            Suspended
          </FilterPill>

          <form className="ml-auto" action="/customers">
            {role && <input type="hidden" name="role" value={role} />}
            {active && <input type="hidden" name="active" value={active} />}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search name or email"
              className="h-9 px-3 text-sm border border-stone-300 bg-white focus:border-stone-900 focus:outline-none"
            />
          </form>
        </div>

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
            Failed to load customers: {error.message}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-white border border-stone-200">
            No customers match these filters.
          </p>
        ) : (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Orders</th>
                  <th className="px-5 py-3 font-medium text-right">Lifetime spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/customers/${r.id}`}
                        className="text-stone-900 font-medium hover:underline"
                      >
                        {r.fullName ?? '—'}
                      </Link>
                      <div className="text-xs text-stone-500">{r.email ?? 'no email'}</div>
                    </td>
                    <td className="px-5 py-3 text-stone-700">{r.phone ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge tone={ROLE_TONES[r.role]}>{r.role}</Badge>
                    </td>
                    <td className="px-5 py-3 text-xs uppercase tracking-wider">
                      {r.isActive ? (
                        <span className="text-emerald-700">Active</span>
                      ) : (
                        <span className="text-rose-700">Suspended</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-stone-600">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-3 tabular text-right">{r.orderCount}</td>
                    <td className="px-5 py-3 tabular text-right">{formatINR(r.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

function buildHref(params: { role?: string; active?: string; q?: string }) {
  const sp = new URLSearchParams()
  if (params.role) sp.set('role', params.role)
  if (params.active) sp.set('active', params.active)
  if (params.q) sp.set('q', params.q)
  const qs = sp.toString()
  return qs ? `/customers?${qs}` : '/customers'
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
