import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { InventoryRow } from './InventoryRow'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { filter?: 'low' | 'out' }
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const supabase = getAdminClient()

  const { data: rows } = await supabase
    .from('inventory')
    .select(
      `id, variant_id, qty_available, qty_reserved, qty_sold, reorder_level,
       product_variants(sku, color, size, products(name))`,
    )
    .order('qty_available', { ascending: true })
    .limit(200)

  const all = (rows ?? []) as unknown as Array<{
    variant_id: string
    qty_available: number
    qty_reserved: number
    qty_sold: number
    reorder_level: number
    product_variants: {
      sku: string
      color: string | null
      size: string | null
      products: { name: string } | { name: string }[]
    } | null
  }>

  const filtered = all.filter((r) => {
    const free = r.qty_available - r.qty_reserved
    if (searchParams.filter === 'out') return free <= 0
    if (searchParams.filter === 'low') return free > 0 && free <= r.reorder_level
    return true
  })

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Edit qty_available and reorder threshold per variant. Reserved + sold come from order activity."
      />

      <div className="px-8 py-6 space-y-4">
        <div className="flex gap-2 text-xs uppercase tracking-wider">
          <a
            href="/inventory"
            className={!searchParams.filter ? 'text-stone-900 font-medium' : 'text-stone-500'}
          >
            All
          </a>
          <span className="text-stone-300">·</span>
          <a
            href="/inventory?filter=low"
            className={searchParams.filter === 'low' ? 'text-amber-700 font-medium' : 'text-stone-500'}
          >
            Low stock
          </a>
          <span className="text-stone-300">·</span>
          <a
            href="/inventory?filter=out"
            className={searchParams.filter === 'out' ? 'text-red-700 font-medium' : 'text-stone-500'}
          >
            Out of stock
          </a>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-white border border-stone-200">
            No variants match this filter.
          </p>
        ) : (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium">Variant</th>
                  <th className="px-5 py-3 font-medium">Available</th>
                  <th className="px-5 py-3 font-medium">Reserved</th>
                  <th className="px-5 py-3 font-medium">Sold</th>
                  <th className="px-5 py-3 font-medium">Reorder ≤</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Save</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filtered.map((row) => {
                  const variant = row.product_variants
                  const productMaybe = variant?.products
                  const product = Array.isArray(productMaybe) ? productMaybe[0] : productMaybe
                  const variantLabel = [variant?.color, variant?.size].filter(Boolean).join(' · ')
                  return (
                    <InventoryRow
                      key={row.variant_id}
                      variantId={row.variant_id}
                      productName={product?.name ?? '—'}
                      sku={variant?.sku ?? '—'}
                      variantLabel={variantLabel}
                      qtyAvailable={row.qty_available}
                      qtyReserved={row.qty_reserved}
                      qtySold={row.qty_sold}
                      reorderLevel={row.reorder_level}
                    />
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
