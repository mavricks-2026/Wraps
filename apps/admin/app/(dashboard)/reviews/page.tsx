import Link from 'next/link'
import { cn } from '@goodsly/utils'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { ReviewActions } from './ReviewActions'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { filter?: 'pending' | 'approved' }
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const supabase = getAdminClient()
  const filter = searchParams.filter ?? 'pending'

  let query = supabase
    .from('reviews')
    .select(
      `id, rating, title, body, is_verified_purchase, is_approved, created_at,
       products(name, slug),
       profiles(full_name)`,
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter === 'pending') query = query.eq('is_approved', false)
  if (filter === 'approved') query = query.eq('is_approved', true)

  const { data: reviews } = await query

  return (
    <>
      <PageHeader title="Reviews" description="Approve customer reviews before they appear on the storefront." />

      <div className="px-8 py-6 space-y-4">
        <div className="flex gap-2">
          <FilterPill href="/reviews?filter=pending" active={filter === 'pending'}>
            Pending
          </FilterPill>
          <FilterPill href="/reviews?filter=approved" active={filter === 'approved'}>
            Approved
          </FilterPill>
          <FilterPill href="/reviews" active={!searchParams.filter}>All</FilterPill>
        </div>

        {!reviews || reviews.length === 0 ? (
          <p className="text-sm text-stone-500 py-12 text-center bg-white border border-stone-200">
            No {filter === 'pending' ? 'pending ' : ''}reviews.
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const product = (Array.isArray(r.products) ? r.products[0] : r.products) as
                | { name: string; slug: string }
                | null
              const profile = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as
                | { full_name: string | null }
                | null
              return (
                <article
                  key={r.id as string}
                  className="bg-white border border-stone-200 p-5 flex gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-sm">
                      <Stars rating={r.rating as number} />
                      <span className="text-stone-700">
                        {profile?.full_name ?? 'Anonymous'}
                      </span>
                      {r.is_verified_purchase && (
                        <span className="text-xs uppercase tracking-wider text-emerald-700">
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-stone-500">
                        {new Date(r.created_at as string).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })}
                      </span>
                    </div>
                    {r.title && <h3 className="font-medium mt-2">{r.title as string}</h3>}
                    {r.body && (
                      <p className="text-sm text-stone-700 mt-1 whitespace-pre-wrap">
                        {r.body as string}
                      </p>
                    )}
                    {product && (
                      <p className="text-xs text-stone-500 mt-3">
                        Product:{' '}
                        <Link
                          href={`http://localhost:3000/products/${product.slug}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          {product.name} ↗
                        </Link>
                      </p>
                    )}
                  </div>
                  <ReviewActions
                    reviewId={r.id as string}
                    isApproved={r.is_approved as boolean}
                  />
                </article>
              )
            })}
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

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5`} className="text-amber-500 tracking-tight">
      {'★'.repeat(rating)}
      <span className="text-stone-300">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}
