'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'

interface CouponInput {
  code: string
  description?: string
  type: 'percent' | 'flat' | 'free_product'
  value?: number | null
  free_product_id?: string | null
  min_order_value?: number
  max_uses?: number | null
  expires_at?: string | null
  is_active?: boolean
}

export async function createCoupon(
  input: CouponInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const code = input.code.trim().toUpperCase()
  if (!code) return { ok: false, error: 'Code is required' }
  if ((input.type === 'percent' || input.type === 'flat') && input.value == null) {
    return { ok: false, error: 'Value is required for percent/flat coupons' }
  }
  if (input.type === 'percent' && input.value != null && (input.value < 0 || input.value > 100)) {
    return { ok: false, error: 'Percent value must be between 0 and 100' }
  }
  if (input.type === 'free_product' && !input.free_product_id) {
    return { ok: false, error: 'Pick a free product for free_product coupons' }
  }

  const admin = getAdminClient()
  const { error } = await admin.from('coupons').insert({
    code,
    description: input.description ?? null,
    type: input.type,
    value: input.type === 'free_product' ? null : input.value ?? null,
    free_product_id: input.type === 'free_product' ? input.free_product_id ?? null : null,
    min_order_value: input.min_order_value ?? 0,
    max_uses: input.max_uses ?? null,
    expires_at: input.expires_at || null,
    is_active: input.is_active ?? true,
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/coupons')
  return { ok: true }
}

export async function toggleCoupon(
  couponId: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const admin = getAdminClient()
  const { error } = await admin
    .from('coupons')
    .update({ is_active: active })
    .eq('id', couponId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/coupons')
  return { ok: true }
}

export async function deleteCoupon(
  couponId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const admin = getAdminClient()
  const { error } = await admin.from('coupons').delete().eq('id', couponId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/coupons')
  return { ok: true }
}
