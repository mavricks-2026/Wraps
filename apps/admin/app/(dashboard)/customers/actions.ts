'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'

// Toggle a customer's profiles.is_active flag (suspend / reactivate).
// Guards: admins may never be deactivated, and you cannot deactivate yourself.
export async function setCustomerActive(
  customerId: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAdmin()
  const admin = getAdminClient()

  if (!isActive && customerId === session.userId) {
    return { ok: false, error: 'You cannot deactivate your own account.' }
  }

  const { data: profile, error: fetchError } = await admin
    .from('profiles')
    .select('role, is_active')
    .eq('id', customerId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!profile) return { ok: false, error: 'Customer not found' }

  if (!isActive && (profile.role as string) === 'admin') {
    return { ok: false, error: 'Admin accounts cannot be deactivated.' }
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', customerId)

  if (updateError) return { ok: false, error: updateError.message }

  revalidatePath(`/customers/${customerId}`)
  revalidatePath('/customers')
  return { ok: true }
}
