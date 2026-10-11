'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'

export async function approveReview(
  reviewId: string,
  approve: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const admin = getAdminClient()
  const { error } = await admin
    .from('reviews')
    .update({ is_approved: approve })
    .eq('id', reviewId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/reviews')
  return { ok: true }
}

export async function deleteReview(
  reviewId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  const admin = getAdminClient()
  const { error } = await admin.from('reviews').delete().eq('id', reviewId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/reviews')
  return { ok: true }
}
