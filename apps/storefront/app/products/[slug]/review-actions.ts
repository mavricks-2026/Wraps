'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: true } | { ok: false; error: string }

export interface ReviewInput {
  productId: string
  slug: string
  rating: number
  title: string
  body: string
}

export async function submitReview(input: ReviewInput): Promise<Result> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sign in to write a review' }

  const rating = Math.round(Number(input.rating))
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Please choose a rating between 1 and 5' }
  }

  const title = input.title?.trim() || null
  const body = input.body?.trim() || null

  // Determine verified-purchase: has the user bought this product before?
  const { data: purchase } = await supabase
    .from('order_items')
    .select('id, orders!inner(user_id), product_variants!inner(product_id)')
    .eq('orders.user_id', user.id)
    .eq('product_variants.product_id', input.productId)
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('reviews').insert({
    product_id: input.productId,
    user_id: user.id,
    rating,
    title,
    body,
    is_verified_purchase: Boolean(purchase),
    is_approved: false,
  })

  if (error) {
    // Unique(product_id, user_id) violation -> already reviewed
    if (error.code === '23505') {
      return { ok: false, error: 'You have already reviewed this product' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/products/${input.slug}`)
  return { ok: true }
}
