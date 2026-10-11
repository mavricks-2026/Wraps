'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string }

export interface PromotionInput {
  id?: string
  title: string
  banner_image_url?: string | null
  mobile_image_url?: string | null
  badge_text?: string | null
  link_url?: string | null
  sort_order?: number
  starts_at?: string | null
  ends_at?: string | null
  is_active?: boolean
}

function validate(input: PromotionInput): string | null {
  if (!input.title?.trim()) return 'Title is required'
  if (input.starts_at && input.ends_at) {
    if (new Date(input.starts_at).getTime() > new Date(input.ends_at).getTime()) {
      return 'Start date must be before end date'
    }
  }
  return null
}

function clean(input: PromotionInput) {
  return {
    title: input.title.trim(),
    banner_image_url: input.banner_image_url || null,
    mobile_image_url: input.mobile_image_url || null,
    badge_text: input.badge_text?.trim() || null,
    link_url: input.link_url?.trim() || null,
    sort_order: Number.isFinite(input.sort_order) ? (input.sort_order as number) : 0,
    starts_at: input.starts_at || null,
    ends_at: input.ends_at || null,
    is_active: input.is_active ?? true,
  }
}

export async function createPromotion(
  input: PromotionInput,
): Promise<Result<{ id: string }>> {
  await requireAdmin()
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('promotions')
    .insert(clean(input))
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/promotions')
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function updatePromotion(input: PromotionInput): Promise<Result> {
  await requireAdmin()
  if (!input.id) return { ok: false, error: 'Missing promotion id' }
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const admin = getAdminClient()
  const { error } = await admin.from('promotions').update(clean(input)).eq('id', input.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/promotions')
  return { ok: true }
}

export async function deletePromotion(promotionId: string): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()
  // promo_products rows cascade via FK ON DELETE CASCADE
  const { error } = await admin.from('promotions').delete().eq('id', promotionId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/promotions')
  return { ok: true }
}

export async function togglePromotion(
  promotionId: string,
  active: boolean,
): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()
  const { error } = await admin
    .from('promotions')
    .update({ is_active: active })
    .eq('id', promotionId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/promotions')
  return { ok: true }
}

// ─────────────────────────────────────────────
// Images (Supabase Storage 'banner-images' bucket)
// ─────────────────────────────────────────────

export async function uploadBannerImage(
  formData: FormData,
): Promise<Result<{ url: string }>> {
  await requireAdmin()
  const file = formData.get('file') as File | null
  const slot = (formData.get('slot') as string | null) ?? 'banner' // 'banner' | 'mobile'

  if (!file || file.size === 0) return { ok: false, error: 'No file selected' }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'Max image size is 5 MB' }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `${slot}/${crypto.randomUUID()}.${ext}`

  const admin = getAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('banner-images')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return { ok: false, error: uploadError.message }

  const { data: pub } = admin.storage.from('banner-images').getPublicUrl(path)
  return { ok: true, data: { url: pub.publicUrl } }
}

// ─────────────────────────────────────────────
// Featured products (promo_products)
// ─────────────────────────────────────────────

export async function addPromoProduct(
  promotionId: string,
  productId: string,
): Promise<Result> {
  await requireAdmin()
  if (!productId) return { ok: false, error: 'Pick a product to add' }
  const admin = getAdminClient()

  // Append at the end: next sort_order after the current max.
  const { data: rows } = await admin
    .from('promo_products')
    .select('sort_order')
    .eq('promotion_id', promotionId)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextSort = ((rows?.[0]?.sort_order as number | undefined) ?? -1) + 1

  const { error } = await admin.from('promo_products').insert({
    promotion_id: promotionId,
    product_id: productId,
    sort_order: nextSort,
  })

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Product is already featured' }
    return { ok: false, error: error.message }
  }
  revalidatePath('/promotions')
  return { ok: true }
}

export async function removePromoProduct(promoProductId: string): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()
  const { error } = await admin.from('promo_products').delete().eq('id', promoProductId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/promotions')
  return { ok: true }
}
