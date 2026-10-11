'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AddressInput } from '@/lib/use-addresses'

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function validate(input: AddressInput): string | null {
  if (!input.full_name?.trim()) return 'Full name is required'
  if (!input.phone?.trim()) return 'Phone is required'
  if (!input.line1?.trim()) return 'Address line 1 is required'
  if (!input.city?.trim()) return 'City is required'
  if (!input.state?.trim()) return 'State is required'
  if (!input.pincode?.trim()) return 'Pincode is required'
  if (!/^\d{6}$/.test(input.pincode.trim())) return 'Pincode must be 6 digits'
  return null
}

async function getUserId(): Promise<{ id: string } | { error: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }
  return { id: user.id }
}

// Clear is_default on all of the user's addresses. The unique partial index allows only one
// default per user, so existing defaults must be cleared before setting a new one.
async function clearDefaults(userId: string): Promise<string | null> {
  const supabase = createClient()
  const { error } = await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true)
  return error ? error.message : null
}

export async function createAddress(input: AddressInput): Promise<Result> {
  const auth = await getUserId()
  if ('error' in auth) return { ok: false, error: auth.error }
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const supabase = createClient()

  // First address becomes the default automatically; otherwise honour the requested flag.
  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', auth.id)
  const makeDefault = input.is_default || (count ?? 0) === 0

  if (makeDefault) {
    const clearErr = await clearDefaults(auth.id)
    if (clearErr) return { ok: false, error: clearErr }
  }

  const { error } = await supabase.from('addresses').insert({
    user_id: auth.id,
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    line1: input.line1.trim(),
    line2: input.line2?.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    pincode: input.pincode.trim(),
    country: input.country?.trim() || 'IN',
    is_default: makeDefault,
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account/addresses')
  return { ok: true }
}

export async function updateAddress(input: AddressInput): Promise<Result> {
  const auth = await getUserId()
  if ('error' in auth) return { ok: false, error: auth.error }
  if (!input.id) return { ok: false, error: 'Missing address id' }
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const supabase = createClient()

  if (input.is_default) {
    const clearErr = await clearDefaults(auth.id)
    if (clearErr) return { ok: false, error: clearErr }
  }

  // RLS restricts the row to the signed-in user; the user_id filter is belt-and-braces.
  const { error } = await supabase
    .from('addresses')
    .update({
      full_name: input.full_name.trim(),
      phone: input.phone.trim(),
      line1: input.line1.trim(),
      line2: input.line2?.trim() || null,
      city: input.city.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
      country: input.country?.trim() || 'IN',
      is_default: input.is_default ?? false,
    })
    .eq('id', input.id)
    .eq('user_id', auth.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account/addresses')
  return { ok: true }
}

export async function deleteAddress(addressId: string): Promise<Result> {
  const auth = await getUserId()
  if ('error' in auth) return { ok: false, error: auth.error }

  const supabase = createClient()
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', auth.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account/addresses')
  return { ok: true }
}

export async function setDefaultAddress(addressId: string): Promise<Result> {
  const auth = await getUserId()
  if ('error' in auth) return { ok: false, error: auth.error }
  const supabase = createClient()

  // Clear all defaults first (unique partial index allows only one default per user),
  // then set the chosen address as
 default.
  const clearErr = await clearDefaults(auth.id)
  if (clearErr) return { ok: false, error: clearErr }

  const { error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('user_id', auth.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account/addresses')
  return { ok: true }
}
