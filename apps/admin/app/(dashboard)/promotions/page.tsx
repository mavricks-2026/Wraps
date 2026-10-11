import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@goodsly/ui'
import { PromotionForm } from './PromotionForm'
import { PromotionRowActions } from './PromotionRowActions'

export const dynamic = 'force-dynamic'

function fmtWindow(starts: string | null, ends: string | null): string {
  const f = (s: string) =>
    new Date(s).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  if (!starts && !ends) return 'Always'
  if (starts && !ends) return `From ${f(starts)}`
  if (!starts && ends) return `Until ${f(ends as string)}`
  return `${f(starts as string)} → ${f(ends as string)}`
}

export default async function PromotionsPage() {
  await requireAdmin()
  const supabase = getAdminClient()

  const [{ data: promotions }, { data: products }] = await Promise.all([
    supabase
      .from('promotions')
      .select(
        'id, title, banner_image_url, mobile_image_url, badge_text, link_url, sort_order, starts_at, ends_at, is_active, promo_products(id, product_id, sort_order, products(id, name, slug))',
      )
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  const productOptions = (products ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
  }))

  return (
    <>
      <PageHeader
        title="Promotions"
        description="Homepage banners and featured-product sections. Ended promotions auto-deactivate hourly."
      />

      <div className="px-8 py-6 space-y-6">
        <PromotionForm products={productOptions} />

        {!promotions || promotions.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-white border border-stone-200">
            No promotions yet. Create one above.
          </p>
        ) : (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Badge</th>
                  <th className="px-5 py-3 font-medium">Schedule</th>
                  <th className="px-5 py-3 font-medium">Featured</th>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {promotions.map((p) => {
                  const promoProducts = ((p.promo_products as unknown[]) ?? []) as Array<{
                    id: string
                    product_id: string
                    sort_order: number
                    products: { id: string; name: string; slug: string } | null
                  }>
                  return (
                    <tr key={p.id as string} className="hover:bg-stone-50 align-top">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.banner_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.banner_image_url as string}
                              alt=""
                              className="h-10 w-16 object-cover border border-stone-200 bg-stone-100"
                            />
                          ) : (
                            <div className="h-10 w-16 border border-stone-200 bg-stone-100" />
                          )}
                          <div>
                            <span className="font-medium">{p.title as string}</span>
                            {p.link_url && (
                              <div className="text-xs text-stone-500 truncate max-w-[16rem]">
                                {p.link_url as string}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {p.badge_text ? (
                          <Badge tone="sale">{p.badge_text as string}</Badge>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-stone-600 text-xs">
                        {fmtWindow(
                          p.starts_at as string | null,
                          p.ends_at as string | null,
                        )}
                      </td>
                      <td className="px-5 py-3 tabular text-stone-600">
                        {promoProducts.length}
                      </td>
                      <td className="px-5 py-3 tabular text-stone-600">
                        {p.sort_order as number}
                      </td>
                      <td className="px-5 py-3 text-xs uppercase tracking-wider">
                        {p.is_active ? (
                          <span className="text-emerald-700">Active</span>
                        ) : (
                          <span className="text-stone-400">Inactive</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <PromotionRowActions
                          promotion={{
                            id: p.id as string,
                            title: p.title as string,
                            banner_image_url: (p.banner_image_url as string) ?? null,
                            mobile_image_url: (p.mobile_image_url as string) ?? null,
                            badge_text: (p.badge_text as string) ?? null,
                            link_url: (p.link_url as string) ?? null,
                            sort_order: (p.sort_order as number) ?? 0,
                            starts_at: (p.starts_at as string) ?? null,
                            ends_at: (p.ends_at as string) ?? null,
                            is_active: p.is_active as boolean,
                          }}
                          featured={promoProducts
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((pp) => ({
                              id: pp.id,
                              productId: pp.product_id,
                              name: pp.products?.name ?? '(deleted product)',
                            }))}
                          products={productOptions}
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
