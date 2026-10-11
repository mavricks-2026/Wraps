import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Shop',
}

const COLLECTIONS = [
  { slug: 'bags', label: 'Bags', icon: 'shopping_bag' },
  { slug: 'organisers', label: 'Organisers', icon: 'work' },
  { slug: 'wellness', label: 'Wellness', icon: 'spa' },
  { slug: 'gifting', label: 'Gifting', icon: 'redeem' },
]

export default async function ShopPage() {
  const supabase = createClient()

  const { data: products } = await supabase
    .from('products')
    .select(
      'id, name, slug, base_price, compare_price, is_just_in, product_images(url, is_primary)',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(48)

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <header className="mb-8">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-pink">The collection</p>
        <h1 className="font-display text-h2 font-semibold text-ink">Shop</h1>
        <p className="mt-1 max-w-xl text-body text-muted">
          Every piece is made to order — add a photo, a name, or a private joke and we
          turn it into a keepsake they will keep forever.
        </p>
      </header>

      <div className="mb-10 flex flex-wrap gap-3">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.slug}
            href={`/collections/${c.slug}`}
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink shadow-card transition-all hover:-translate-y-0.5 hover:border-pink/40 hover:text-plum hover:shadow-lift"
          >
            <span className="msym text-[20px] text-pink" aria-hidden>
              {c.icon}
            </span>
            {c.label}
          </Link>
        ))}
      </div>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soft">
            <span className="msym msym-filled text-3xl text-pink" aria-hidden>
              shopping_bag
            </span>
          </div>
          <h2 className="mt-5 font-display text-h3 font-semibold text-ink">
            Nothing on the shelves yet
          </h2>
          <p className="mt-2 max-w-sm text-body-sm text-muted">
            Our keepsakes are being restocked. Check back very soon.
          </p>
        </div>
      )}
    </div>
  )
}
