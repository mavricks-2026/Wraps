'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'

export async function adjustInventory(
  variantId: string,
  qtyAvailable: number,
  reorderLevel: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin()
  if (!Number.isFinite(qtyAvailable) || qtyAvailable < 0) {
    return { ok: false, error: 'Quantity must be a non-negative number' }
  }
  if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
    return { ok: false, error: 'Reorder level must be a non-negative number' }
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from('inventory')
    .update({
      qty_available: qtyAvailable,
      reorder_level: reorderLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('variant_id', variantId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/inventory')
  revalidatePath('/')
  return { ok: true }
}
