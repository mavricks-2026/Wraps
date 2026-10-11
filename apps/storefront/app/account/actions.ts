'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: true } | { ok: false; error: string }

export interface ProfileInput {
  full_name: string
  phone: string
}

export async function updateProfile(input: ProfileInput): Promise<Result> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in' }

  const fullName = input.full_name?.trim()
  if (!fullName) return { ok: false, error: 'Name is required' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone: input.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/account')
  return { ok: true }
}
