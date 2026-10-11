import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { NewsletterCta } from '@/components/layout/NewsletterCta'

export const revalidate = 0

function Wave({ className }: { className: string }) {
  return (
    <div className={className} aria-hidden>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block h-12 w-full sm:h-16">
        <path
          d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,60 L1200,120 L0,120 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

export default async function HomePage() {
  const supabase = createClient()
  const [{ data: justIn }, { data: categories }] = await Promise.all([
    supabase.from('products').select('id, name, slug, base_price, compare_price, is_just_in, product_images(url, is_primary)').eq('is_active', true).eq('is_just_in', true).limit(8),
    supabase.from('categories').select('id, name, slug, image_url').eq('is_active', true).is('parent_id', null).order('sort_order', { ascending: true }),
  ])
  return (
    <>
      <section className="overflow-hidden bg-canvas pt-14 pb-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-pink">Personalized gifting</p>
            <h1 className="font-display text-display font-semibold tracking-tight text-ink">Gifts Designed By You,<br />Made With Love</h1>
            <p className="mt-5 max-w-lg text-body-lg text-muted">Add your photo, your name, your story. We turn it into a gift they will keep forever.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/collections/bags" className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white transition-colors hover:bg-plum">Explore Collection</Link>
              <Link href="/about" className="inline-flex h-12 items-center justify-center rounded-full border border-pink px-8 text-sm font-semibold text-pink transition-colors hover:bg-tint">Our Story</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-card bg-soft arch-full shadow-glow">
              <span className="msym msym-filled text-[120px] text-pink/60" aria-hidden>featured_seasonal_and_gifts</span>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-card bg-surface px-5 py-3 shadow-lift">
              <p className="font-display text-sm font-semibold text-plum">Free gift wrapping</p>
            </div>
          </div>
        </div>
      </section>
      <Wave className="text-tint" />
      <section className="bg-tint pb-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-h2 font-semibold text-ink">Shop by Category</h2>
          {categories && categories.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link key={cat.id} href={'/collections/' + cat.slug} className="group flex flex-col items-center rounded-card border border-line bg-surface p-5 text-center shadow-card">
                  <span className="font-display text-sm font-semibold text-ink">{cat.name}</span>
                </Link>
              ))}
            </div>
          ) : (<p className="mt-8 text-sm text-muted">No categories configured yet.</p>)}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16" id="trending">
        <h2 className="font-display text-h2 font-semibold text-ink">Trending Now</h2>
        {justIn && justIn.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {justIn.map((product) => (<ProductCard key={product.id} product={product} />))}
          </div>
        ) : (<p className="text-sm text-muted">No new arrivals yet.</p>)}
      </section>
      <section className="bg-soft py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-h2 font-semibold text-ink">Get 10% off your first personalized gift</h2>
          <div className="mt-8"><NewsletterCta /></div>
        </div>
      </section>
    </>
  )
}