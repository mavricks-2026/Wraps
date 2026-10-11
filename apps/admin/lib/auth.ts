import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export interface AdminSession {
  userId: string
  email: string
  fullName: string | null
  role: 'admin' | 'staff'
}

// Use this in every admin page/server action.
// Returns the current admin session, or redirects to /sign-in.
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Read the user's own profile via their session — the `user_read_own_profile`
  // RLS policy (auth.uid() = id) covers this without needing service role.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !(profile as { is_active: boolean }).is_active) {
    redirect('/sign-in?error=inactive')
  }
  const role = (profile as { role: string }).role
  if (role !== 'admin' && role !== 'staff') {
    redirect('/sign-in?error=not_admin')
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    fullName: ((profile as { full_name: string | null }).full_name) ?? null,
    role: role as 'admin' | 'staff',
  }
}
