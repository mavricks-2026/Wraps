'use client'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Button, Input, Badge } from '@/components/ui'
import { cn } from '@goodsly/utils'
import { getSupabase } from '@/lib/supabase/client'
import { useSession } from '@/lib/use-session'
import { submitReview } from '@/app/products/[slug]/review-actions'

interface ReviewRow {
  id: string
  user_id: string
  rating: number
  title: string | null
  body: string | null
  is_verified_purchase: boolean
  is_approved: boolean
  created_at: string
  profiles: { full_name: string | null } | { full_name: string | null }[] | null
}

const REVIEW_SELECT = `
  id,
  user_id,
  rating,
  title,
  body,
  is_verified_purchase,
  is_approved,
  created_at,
  profiles(full_name)
` as const

function profileName(row: ReviewRow): string | null {
  const p = row.profiles
  if (!p) return null
  const profile = Array.isArray(p) ? p[0] : p
  return profile?.full_name ?? null
}

function reviewerLabel(row: ReviewRow): string {
  const name = profileName(row)?.trim()
  if (name) return name.split(/\s+/)[0] ?? name
  return 'Verified buyer'
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex', className)} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'text-pink' : 'text-line'}>
          ★
        </span>
      ))}
    </span>
  )
}

export function ProductReviews({ productId, slug }: { productId: string; slug: string }) {
  const { user } = useSession()
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('reviews')
      .select(REVIEW_SELECT)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    setReviews((data ?? []) as unknown as ReviewRow[])
    setLoading(false)
  }, [productId])

  useEffect(() => {
    load()
  }, [load, user])

  // RLS returns approved reviews plus the current user's own (pending) review.
  const approved = useMemo(() => reviews.filter((r) => r.is_approved), [reviews])
  const myReview = useMemo(
    () => (user ? reviews.find((r) => r.user_id === user.id) ?? null : null),
    [reviews, user],
  )

  const count = approved.length
  const average =
    count > 0 ? approved.reduce((sum, r) => sum + r.rating, 0) / count : 0

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16" aria-labelledby="reviews-heading">
      <div className="border-t border-line pt-10">
        <div className="mb-6 flex items-baseline gap-4">
          <h2 id="reviews-heading" className="font-display text-h2 font-semibold text-ink">
            Reviews
          </h2>
          {count > 0 && (
            <span className="flex items-center gap-2 text-sm text-muted">
              <Stars value={Math.round(average)} />
              <span>
                {average.toFixed(1)} · {count} {count === 1 ? 'review' : 'reviews'}
              </span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {loading ? (
              <p className="text-sm text-muted">Loading reviews…</p>
            ) : approved.length === 0 ? (
              <p className="text-sm text-muted">No reviews yet. Be the first to write one.</p>
            ) : (
              approved.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>

          <div className="md:border-l md:border-line md:pl-8">
            {myReview ? (
              <MyReviewPanel review={myReview} />
            ) : user ? (
              <ReviewForm productId={productId} slug={slug} onSubmitted={load} />
            ) : (
              <div className="space-y-3">
                <h3 className="font-display text-lg font-semibold text-ink">Write a review</h3>
                <p className="text-sm text-muted">
                  Please sign in to share your thoughts on this product.
                </p>
                <Link href={`/sign-in?redirect=/products/${slug}`}>
                  <Button variant="outline" className="w-full">
                    Sign in to review
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function ReviewCard({ review }: { review: ReviewRow }) {
  return (
    <article className="rounded-card border-b border-line bg-surface p-5 shadow-card last:border-0">
      <div className="mb-1 flex items-center gap-3">
        <Stars value={review.rating} />
        {review.is_verified_purchase && <Badge tone="new">Verified purchase</Badge>}
      </div>
      {review.title && <h3 className="font-display font-semibold text-ink">{review.title}</h3>}
      {review.body && <p className="mt-1 text-sm leading-relaxed text-muted">{review.body}</p>}
      <p className="mt-2 text-xs text-muted/80">
        {reviewerLabel(review)} ·{' '}
        {new Date(review.created_at).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </article>
  )
}

function MyReviewPanel({ review }: { review: ReviewRow }) {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold text-ink">Your review</h3>
      <div className="space-y-2 rounded-card border border-line bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Stars value={review.rating} />
          <Badge tone={review.is_approved ? 'new' : 'neutral'}>
            {review.is_approved ? 'Published' : 'Pending review'}
          </Badge>
        </div>
        {review.title && <p className="font-display font-semibold text-ink">{review.title}</p>}
        {review.body && <p className="text-sm text-muted">{review.body}</p>}
      </div>
      {!review.is_approved && (
        <p className="text-xs text-muted">
          Thanks! Your review is awaiting moderation and will appear once approved.
        </p>
      )}
    </div>
  )
}

function ReviewForm({
  productId,
  slug,
  onSubmitted,
}: {
  productId: string
  slug: string
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (rating < 1) {
      setError('Please choose a rating')
      return
    }
    startTransition(async () => {
      const res = await submitReview({ productId, slug, rating, title, body })
      if (!res.ok) {
        setError(res.error)
        return
      }
      onSubmitted()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-ink">Write a review</h3>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-wider text-muted">Rating</label>
        <div className="flex gap-1 text-2xl" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className={cn(
                'leading-none transition-colors',
                n <= (hover || rating) ? 'text-pink' : 'text-line',
              )}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-title" className="mb-1 block text-xs uppercase tracking-wider text-muted">
          Title
        </label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum it up in a few words"
          maxLength={120}
        />
      </div>

      <div>
        <label htmlFor="review-body" className="mb-1 block text-xs uppercase tracking-wider text-muted">
          Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="What did you like or dislike?"
          className="w-full rounded-control border border-line bg-white px-3 py-2 text-sm placeholder:text-muted/60 focus:border-pink focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-pink-strong">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Submitting…' : 'Submit review'}
      </Button>
      <p className="text-xs text-muted">Reviews are published after moderation.</p>
    </form>
  )
}
