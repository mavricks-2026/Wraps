import { formatINR } from '@goodsly/utils'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { NewCouponForm } from './NewCouponForm'
import { CouponRowActions } from './CouponRowActions'

export const dynamic = 'force-dynamic'

export default async function CouponsPage() {
  const supabase = getAdminClient()

  const [{ data: coupons }, { data: products }] = await Promise.all([
    supabase
      .from('coupons')
      .select(
        'id, code, description, type, value, free_product_id, min_order_value, max_uses, used_count, is_active, expires_at, created_at',
      )
      .order('created_at', { ascending: false }),
    supabase.from('products').select('id, name').eq('is_active', true).order('name'),
  ])

  const now = Date.now()

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes and free-product offers." />

      <div className="px-8 py-6 space-y-6">
        <NewCouponForm
          products={(products ?? []).map((p) => ({
            id: p.id as string,
            name: p.name as string,
          }))}
        />

        {!coupons || coupons.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-white border border-stone-200">
            No coupons yet. Create one above.
          </p>
        ) : (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium">Code</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Reward</th>
                  <th className="px-5 py-3 font-medium">Min order</th>
                  <th className="px-5 py-3 font-medium">Uses</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {coupons.map((c) => {
                  const expired =
                    c.expires_at && new Date(c.expires_at as string).getTime() < now
                  const reward =
                    c.type === 'percent'
                      ? `${c.value}% off`
                      : c.type === 'flat'
                      ? `${formatINR(c.value as number)} off`
                      : 'Free product'
                  const usesLabel = c.max_uses
                    ? `${c.used_count} / ${c.max_uses}`
                    : `${c.used_count} / ∞`
                  return (
                    <tr key={c.id as string} className="hover:bg-stone-50">
                      <td className="px-5 py-3">
                        <span className="font-mono font-medium">{c.code as string}</span>
                        {c.description && (
                          <div className="text-xs text-stone-500">{c.description as string}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-stone-600 capitalize">
                        {(c.type as string).replace('_', ' ')}
                      </td>
                      <td className="px-5 py-3">{reward}</td>
                      <td className="px-5 py-3 tabular text-stone-600">
                        {(c.min_order_value as number) > 0 ? formatINR(c.min_order_value as number) : '—'}
                      </td>
                      <td className="px-5 py-3 tabular text-stone-600">{usesLabel}</td>
                      <td className="px-5 py-3 text-xs uppercase tracking-wider">
                        {expired ? (
                          <span className="text-stone-400">Expired</span>
                        ) : c.is_active ? (
                          <span className="text-emerald-700">Active</span>
                        ) : (
                          <span className="text-stone-400">Disabled</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <CouponRowActions
                          couponId={c.id as string}
                          isActive={c.is_active as boolean}
                        />
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
