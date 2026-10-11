import Link from 'next/link'

export const metadata = { title: 'Our Story — WrapUrs' }

const values = [
  {
    icon: 'favorite',
    title: 'Made personal',
    body: 'Your photos, names, and milestones become the centrepiece of every piece we make.',
  },
  {
    icon: 'workspace_premium',
    title: 'Artisan quality',
    body: 'Hand-finished by Indian craftspeople using materials chosen to last for years, not seasons.',
  },
  {
    icon: 'local_shipping',
    title: 'Delivered with care',
    body: 'Packed protectively, gift-wrapped free, and tracked all the way to their doorstep.',
  },
]

const steps = [
  {
    icon: 'redeem',
    step: 'Step 01',
    title: 'Choose a gift',
    body: 'Explore our handcrafted catalog of lamps, frames, bracelets, and hampers.',
  },
  {
    icon: 'edit_note',
    step: 'Step 02',
    title: 'Add your photo or name',
    body: 'Upload your sweetest picture, milestone date, or meaningful initials.',
  },
  {
    icon: 'visibility',
    step: 'Step 03',
    title: 'Preview and confirm',
    body: 'Check the bespoke layout mockup and confirm with full confidence.',
  },
  {
    icon: 'local_shipping',
    step: 'Step 04',
    title: 'We craft and deliver',
    body: 'Precision made by artisans and swiftly shipped safe to your doorstep.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-canvas py-16">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-pink">Our Story</p>
          <h1 className="font-display text-display font-semibold text-ink">
            Handcrafted with love, delivered with care
          </h1>
          <p className="mt-5 max-w-2xl text-body-lg text-muted">
            WrapUrs is a personalization-first gifting studio. We turn your photos, names,
            and milestones into keepsakes — lamps, frames, bracelets, and hampers — made by
            Indian artisans and finished by hand for the people who matter most.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
          <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-card bg-soft arch-full shadow-glow">
            <span className="msym msym-filled text-[100px] text-pink/60" aria-hidden>
              diversity_3
            </span>
          </div>
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-pink">How it began</p>
            <h2 className="font-display text-h2 font-semibold text-ink">
              One birthday gift, started it all
            </h2>
            <p className="mt-4 text-body leading-relaxed text-muted">
              WrapUrs began at a kitchen table in 2021, when our founder could not find a
              birthday gift that felt personal enough for her sister. She engraved a photo
              onto a small lamp, wrapped it in blush paper, and watched her sister cry.
            </p>
            <p className="mt-4 text-body leading-relaxed text-muted">
              That single moment grew into a studio of artisans who now craft thousands of
              keepsakes a year — each one carrying someone&apos;s photo, name, or private joke
              into the hands of the person who matters most.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-plum py-12 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 text-center md:grid-cols-4">
          {[
            { stat: '12,000+', label: 'keepsakes crafted' },
            { stat: '520+', label: 'cities delivered' },
            { stat: '4.9/5', label: 'average rating' },
            { stat: '100%', label: 'hand-finished' },
          ].map((item) => (
            <div key={item.label}>
              <p className="font-display text-h2 font-semibold">{item.stat}</p>
              <p className="mt-1 text-sm text-blush/80">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-tint py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-card border border-line bg-surface p-6 shadow-card"
              >
                <span className="msym msym-filled text-[32px] text-pink" aria-hidden>
                  {value.icon}
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold text-ink">{value.title}</h2>
                <p className="mt-2 text-body-sm text-muted">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-h2 font-semibold text-ink">
            How we create your keepsake
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-card border border-line bg-surface p-6 shadow-card"
              >
                <span className="msym msym-filled text-[32px] text-pink" aria-hidden>
                  {item.icon}
                </span>
                <p className="mt-4 text-xs uppercase tracking-wider text-muted">{item.step}</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-body-sm text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-soft py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-h2 font-semibold text-ink">
            Ready to make something unforgettable?
          </h2>
          <div className="mt-8">
            <Link
              href="/collections/bags"
              className="inline-flex h-12 items-center justify-center rounded-full bg-pink px-8 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-plum hover:shadow-none"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}