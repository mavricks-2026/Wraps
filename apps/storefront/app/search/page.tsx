import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { q?: string }
}

export function generateMetadata({ searchParams }: PageProps) {
  const q = (searchParams.q ?? '').trim()
  return { title: q ? `Search: ${q}` : 'Search' }
}

export default async function SearchPage({ searchParams }: PageProps) {
  // Normalise + bound the query; escape % and _ so they aren't treated as ilike wildcards.
  const raw = (searchParams.q ?? '').trim().slice(0, 100)
  const escaped = raw.replace(/[%_]/g, (m) => `\\${m}`)

  let products: React.ComponentProps<typeof ProductCard>['product'][] = []

  if (raw.length > 0) {
    // The products FTS index is an expression index (to_tsvector over name/description/material);
    // there is no generated tsvector column to .textSearch() against, so we use the ilike fallback.
    const { data } = await createClient()
      .from('products')
      .select(
        `id, name, slug, base_price, compare_price, is_just_in,
         product_images(url, is_primary)`,
      )
      .eq('is_active', true)
      .or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`)
      .limit(48)

    products = data ?? []
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <header className="mb-10">
        <h1 className="font-display text-h2 font-semibold text-ink">Search</h1>

        <form action="/search" method="get" className="mt-5 max-w-md">
          <label htmlFor="search-q" className="sr-only">
            Search products
          </label>
          <input
            id="search-q"
            type="search"
            name="q"
            defaultValue={raw}
            placeholder="Search for gifts…"
            className="h-12 w-full rounded-full border border-line bg-tint px-5 text-[15px] text-ink transition-colors placeholder:text-muted/60 focus:border-pink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-pink/25"
          />
        </form>

        {raw.length > 0 && (
          <p className="mt-4 text-body-sm text-muted">
            {products.length} {products.length === 1 ? 'result' : 'results'} for{' '}
            <span className="font-semibold text-ink">&ldquo;{raw}&rdquo;</span>
          </p>
        )}
      </header>

      {raw.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft">
            <span className="msym text-3xl text-pink" aria-hidden>
              search
            </span>
          </div>
          <h2 className="mt-5 font-display text-h3 font-semibold text-ink">
            Find the perfect gift
          </h2>
          <p className="mt-2 max-w-sm text-body-sm text-muted">
            Type a search term above to explore our personalised keepsakes.
          </p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft">
            <span className="msym text-3xl text-pink" aria-hidden>
              favorite
            </span>
          </div>
          <h2 className="mt-5 font-display text-h3 font-semibold text-ink">No results found</h2>
          <p className="mt-2 max-w-sm text-body-sm text-muted">
            Sorry, we couldn&rsquo;t find anything for &ldquo;{raw}&rdquo;. Try a different search
            term.
          </p>
        </div>
      )}
    </div>
  )
}
