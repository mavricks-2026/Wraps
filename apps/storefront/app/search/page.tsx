import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
export const dynamic = 'force-dynamic'
export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const raw = (searchParams.q ?? '').trim().slice(0, 100)
  let products: React.ComponentProps<typeof ProductCard>['product'][] = []
  if (raw.length > 0) {
    const { data } = await createClient().from('products').select('id, name, slug, base_price, compare_price, is_just_in, product_images(url, is_primary)').eq('is_active', true).limit(48)
    products = data ?? []
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <h1 className="font-display text-h2 font-semibold text-ink">Search</h1>
      <form action="/search" method="get" className="mt-5 max-w-md">
        <input id="search-q" type="search" name="q" defaultValue={raw} placeholder="Search for gifts…" className="h-12 w-full rounded-full border border-line bg-tint px-5" />
      </form>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (<ProductCard key={product.id} product={product} />))}
      </div>
    </div>
  )
}