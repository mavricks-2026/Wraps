import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { CategoriesTable, type CategoryRow } from './CategoriesTable'

export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  await requireAdmin()
  const supabase = getAdminClient()

  // `products(count)` returns the per-category product count via the FK relationship.
  const { data: categories } = await supabase
    .from('categories')
    .select(
      'id, name, slug, description, parent_id, image_url, sort_order, is_active, products(count)',
    )
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  const rows = (categories ?? []) as Array<Record<string, unknown>>

  // Build an id -> name map so we can resolve each row's parent name client-side.
  const nameById = new Map<string, string>()
  for (const c of rows) nameById.set(c.id as string, c.name as string)

  const data: CategoryRow[] = rows.map((c) => {
    const products = c.products as Array<{ count: number }> | null
    const productCount = Array.isArray(products) ? products[0]?.count ?? 0 : 0
    const parentId = (c.parent_id as string | null) || null
    return {
      id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      description: (c.description as string | null) ?? null,
      parent_id: parentId,
      image_url: (c.image_url as string | null) ?? null,
      sort_order: (c.sort_order as number | null) ?? 0,
      is_active: (c.is_active as boolean | null) ?? true,
      parent_name: parentId ? nameById.get(parentId) ?? null : null,
      product_count: productCount,
    }
  })

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organize the catalog. Set order, nest under a parent, and toggle visibility."
      />

      <div className="px-8 py-6">
        <CategoriesTable categories={data} />
      </div>
    </>
  )
}
