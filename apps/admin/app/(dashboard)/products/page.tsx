import Link from 'next/link'
import { formatINR, cn } from '@goodsly/utils'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { q?: string; category?: string }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const supabase = getAdminClient()
  const q = searchParams.q?.trim()

  const [{ data: categories }, productsResult] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('sort_order'),
    (async () => {
      let query = supabase
        .from('products')
        .select(
          'id, name, slug, base_price, compare_price, is_active, is_just_in, is_featured, category_id, categories(name), product_variants(id)',
        )
        .order('created_at', { ascending: false })
        .limit(100)
      if (q) query = query.ilike('name', `%${q}%`)
      if (searchParams.category) query = query.eq('category_id', searchParams.category)
      return query
    })(),
  ])

  const products = productsResult.data ?? []

  return (
    <>
      <PageHeader
        title="Products"
        description="Browse the catalog. Click a product to edit, or create a new one."
        action={
          <Link
            href="/products/new"
            className="inline-flex items-center justify-center font-medium tracking-wide uppercase transition-colors bg-stone-900 text-white hover:bg-stone-700 h-10 px-5 text-sm"
          >
            + New product
          </Link>
        }
      />

      <div className="px-8 py-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill href="/products" active={!searchParams.category}>All</FilterPill>
          {(categories ?? []).map((c) => (
            <FilterPill
              key={c.id as string}
              href={`/products?category=${c.id}`}
              active={searchParams.category === c.id}
            >
              {c.name as string}
            </FilterPill>
          ))}

          <form className="ml-auto" action="/products">
            {searchParams.category && (
              <input type="hidden" name="category" value={searchParams.category} />
            )}
            <input
              type="search"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search by name"
              className="h-9 px-3 text-sm border border-stone-300 bg-white focus:border-stone-900 focus:outline-none"
            />
          </form>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-white border border-stone-200">
            No products match.
          </p>
        ) : (
          <div className="bg-white border border-stone-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Variants</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {products.map((p) => {
                  const cat = (Array.isArray(p.categories) ? p.categories[0] : p.categories) as
                    | { name: string }
                    | null
                  const variantCount = (p.product_variants as Array<unknown> | null)?.length ?? 0
                  const onSale =
                    p.compare_price !== null &&
                    (p.compare_price as number) > (p.base_price as number)
                  return (
                    <tr key={p.id as string} className="hover:bg-stone-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/products/${p.id}`}
                          className="font-medium text-stone-900 hover:underline"
                        >
                          {p.name as string}
                        </Link>
                        <a
                          href={`http://localhost:3000/products/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-xs text-stone-500 hover:underline"
                        >
                          {p.slug as string} ↗
                        </a>
                      </td>
                      <td className="px-5 py-3 text-stone-700">{cat?.name ?? '—'}</td>
                      <td className="px-5 py-3 tabular text-stone-700">{variantCount}</td>
                      <td className="px-5 py-3 tabular">
                        {formatINR(p.base_price as number)}
                        {onSale && (
                          <span className="ml-2 text-xs text-stone-400 line-through">
                            {formatINR(p.compare_price as number)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs uppercase tracking-wider text-stone-600 space-x-2">
                        {p.is_active ? (
                          <span className="text-emerald-700">Active</span>
                        ) : (
                          <span className="text-stone-400">Inactive</span>
                        )}
                        {p.is_just_in && <span className="text-stone-900">Just In</span>}
                        {p.is_featured && <span className="text-stone-900">Featured</span>}
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
