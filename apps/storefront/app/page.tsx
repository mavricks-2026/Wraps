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
    supabase
      .from('products')
      .select(
        'id, name, slug, base_price, compare_price, is_just_in, product_images(url, is_primary)',
      )
      .eq('is_active', true)
      .eq('is_just_in', true)
      .limit(8),
    supabase
      .from('categories')
      .select('id, name, slug, image_url')
      .eq('is_active', true)
      .is('parent_id', null)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden bg-canvas pt-14 pb-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-pink">
              Personalized gifting
            </p>
            <h1 className="font-display text-display font-semibold tracking-tight text-ink">
              Gifts Designed By You,
              <br />
              Made With Love
            </h1>
            <p className="mt-5 max-w-lg text-body-lg text-muted">
              Add your photo, your name, your story. We turn it into a gift they will keep
              forever.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/collections/bags"
                className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white transition-colors hover:bg-plum"
              >
                Explore Collection
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-full border border-pink px-8 text-sm font-semibold text-pink transition-colors hover:bg-tint"
              >
                Our Story
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-card bg-soft arch-full shadow-glow">
              <span className="msym msym-filled text-[120px] text-pink/60" aria-hidden>
                featured_seasonal_and_gifts
              </span>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-card bg-surface px-5 py-3 shadow-lift">
              <p className="font-display text-sm font-semibold text-plum">
                Free gift wrapping ♥
              </p>
            </div>
          </div>
        </div>
      </section>

      <Wave className="text-tint" />

      {/* Trust strip */}
      <section className="bg-tint pb-4">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 lg:grid-cols-4">
          <TrustItem icon="redeem" title="Free gift wrapping" body="Every order arrives gift-ready" />
          <TrustItem icon="local_shipping" title="Pan-India delivery" body="Tracked, protectively packed" />
          <TrustItem icon="workspace_premium" title="Artisan crafted" body="Hand-finished, built to last" />
          <TrustItem icon="verified_user" title="Secure payments" body="Razorpay & UPI accepted" />
        </div>
      </section>

      {/* Shop by category */}
      <section className="bg-tint pb-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-h2 font-semibold text-ink">Shop by Category</h2>

          {categories && categories.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/collections/${cat.slug}`}
                  className="group flex flex-col items-center rounded-card border border-line bg-surface p-5 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <div className="mb-3 h-20 w-20 overflow-hidden rounded-image bg-tint">
                    {cat.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="msym msym-filled text-[32px] text-pink" aria-hidden>
                          redeem
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="font-display text-sm font-semibold text-ink transition-colors group-hover:text-plum">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-muted">No categories configured yet.</p>
          )}
        </div>
      </section>

      <Wave className="bg-tint text-canvas" />

      {/* Shop by occasion */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="font-display text-h2 font-semibold text-ink">Shop by Occasion</h2>
        <p className="mt-1 text-body text-muted">
          Whatever the moment, there is a keepsake made for it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            { label: 'Birthdays', icon: 'cake' },
            { label: 'Anniversaries', icon: 'favorite' },
            { label: 'Weddings', icon: 'diamond' },
            { label: 'New Beginnings', icon: 'front_hand' },
            { label: 'Festive Gifting', icon: 'celebration' },
            { label: 'Just Because', icon: 'waving_hand' },
          ].map((occasion) => (
            <Link
              key={occasion.label}
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink shadow-card transition-all hover:-translate-y-0.5 hover:border-pink/40 hover:text-plum hover:shadow-lift"
            >
              <span className="msym text-[20px] text-pink" aria-hidden>
                {occasion.icon}
              </span>
              {occasion.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="mx-auto max-w-7xl px-4 py-16" id="trending">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-h2 font-semibold text-ink">Trending Now</h2>
            <p className="mt-1 text-body text-muted">
              Discover the latest designs everyone is talking about
            </p>
          </div>
          <Link
            href="/collections/bags"
            className="text-sm font-semibold text-plum underline transition-colors hover:text-pink"
          >
            View all
          </Link>
        </div>

        {justIn && justIn.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
            {justIn.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            No new arrivals yet. Run{' '}
            <code className="text-ink">supabase db reset --seed-file supabase/seed.sql</code>{' '}
            to load sample data.
          </p>
        )}
      </section>

      <Wave className="text-tint" />

      {/* How it works */}
      <section className="bg-tint py-16" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-h2 font-semibold text-ink">
            How we create your keepsake
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Step
              icon="redeem"
              step="Step 01"
              title="Choose a gift"
              body="Explore our handcrafted catalog of lamps, frames, bracelets, and hampers."
            />
            <Step
              icon="edit_note"
              step="Step 02"
              title="Add your photo or name"
              body="Upload your sweetest picture, milestone date, or meaningful initials."
            />
            <Step
              icon="visibility"
              step="Step 03"
              title="Preview and confirm"
              body="Check the bespoke layout mockup and confirm with full confidence."
            />
            <Step
              icon="local_shipping"
              step="Step 04"
              title="We craft and deliver"
              body="Precision made by artisans and swiftly shipped safe to your doorstep."
            />
          </div>
        </div>
      </section>

      <Wave className="bg-tint text-canvas" />

      {/* Stories of love */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="font-display text-h2 font-semibold text-ink">Stories of love</h2>
        <p className="mt-1 text-body text-muted">
          Real moments, real smiles from gift givers across India.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Story
            quote="The heart photo lamp made my partner cry happy tears on our 3rd anniversary. The glow is so warm and gentle!"
            name="Aanya S."
            place="Mumbai"
          />
          <Story
            quote="The attention to detail and packaging was stunning. Truly boutique handcrafted quality. Delivered right on schedule."
            name="Kabir & Riya"
            place="Bangalore"
          />
          <Story
            quote="I ordered a custom hamper box for my best friend's wedding. The engraved card made it so personal."
            name="Sneha P."
            place="Delhi"
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-display text-h2 font-semibold text-ink">Questions, answered</h2>
        <div className="mt-8 divide-y divide-line rounded-card border border-line bg-surface shadow-card">
          {[
            {
              q: 'How long does personalization take?',
              a: 'Each keepsake is made to order. Crafting takes 2–4 working days, then delivery adds 2–5 days depending on your city. You will get tracking updates at every step.',
            },
            {
              q: 'Can I preview my design before it is made?',
              a: 'Yes. During checkout you can review the photo, name, or message exactly as it will appear. Our team also does a final quality check before crafting begins.',
            },
            {
              q: 'Do you offer gift wrapping?',
              a: 'Every order ships in our signature gift box with a handwritten-style note card — free of charge, always.',
            },
            {
              q: 'What if something arrives damaged?',
              a: 'Send us a photo within 48 hours of delivery and we will remake or refund the piece, no questions asked.',
            },
          ].map((item) => (
            <details key={item.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  className="msym shrink-0 text-[20px] text-pink transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  add
                </span>
              </summary>
              <p className="mt-3 text-body-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-soft py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-h2 font-semibold text-ink">
            Get 10% off your first personalized gift
          </h2>
          <p className="mx-auto mt-3 max-w-md text-body text-muted">
            Sign up to receive sweetest keepsake inspirations, secret discounts, and early
            access drops.
          </p>
          <div className="mt-8">
            <NewsletterCta />
          </div>
        </div>
      </section>
    </>
  )
}

function TrustItem({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-card border border-line/60 bg-surface/70 p-4">
      <span className="msym msym-filled mt-0.5 text-[24px] text-pink" aria-hidden>
        {icon}
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs leading-snug text-muted">{body}</p>
      </div>
    </div>
  )
}

function Step({
  icon,
  step,
  title,
  body,
}: {
  icon: string
  step: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-6 shadow-card">
      <span className="msym msym-filled text-[32px] text-pink" aria-hidden>
        {icon}
      </span>
      <p className="mt-4 text-xs uppercase tracking-wider text-muted">{step}</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-body-sm text-muted">{body}</p>
    </div>
  )
}

function Story({ quote, name, place }: { quote: string; name: string; place: string }) {
  return (
    <figure className="rounded-card border border-line bg-surface p-6 shadow-card">
      <div className="mb-3 text-pink" aria-label="5 out of 5 stars">
        ★★★★★
      </div>
      <blockquote className="text-body italic leading-relaxed text-ink">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-4 text-sm text-muted">
        <span className="font-display font-semibold text-plum">{name}</span> · {place}
      </figcaption>
    </figure>
  )
}
