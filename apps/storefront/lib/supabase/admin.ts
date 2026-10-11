import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service-role client — BYPASSES RLS. Server-only (no 'use client'; reads a
// server secret). Do not import from a client component.
// The storefront uses this in checkout server actions / payment routes to
// create orders, order_items and payments (the `orders` table has no
// user-INSERT RLS policy) and to call the inventory reservation RPCs.
//
// NEVER import this from a client component or pass its instance to one.
// Always scope queries to the authenticated user's id (resolved from the
// session via lib/supabase/server.ts) — this client trusts the caller.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any, 'public', any>

let _admin: AdminClient | null = null

export function getAdminClient(): AdminClient {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to the storefront env — order creation needs it to bypass RLS.',
    )
  }
  _admin = createClient<any, 'public', any>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _admin
}
