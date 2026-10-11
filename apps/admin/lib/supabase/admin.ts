import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service-role client — BYPASSES RLS. Server-only.
// Used by admin server actions for writes that need full privileges
// (status changes, inventory adjustments, coupon CRUD, review approval).
//
// NEVER import this from a client component or pass its instance to one.
//
// Typed as `SupabaseClient` (no Database generic) — supabase-js's strict row
// inference resolves to `never` for every column without generated types.
// Run `supabase gen types typescript` to replace this with proper typing.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, 'public', any>

let _admin: AdminClient | null = null

export function getAdminClient(): AdminClient {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to apps/admin/.env.local — admin writes need it to bypass RLS.',
    )
  }
  _admin = createClient<any, 'public', any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _admin
}
