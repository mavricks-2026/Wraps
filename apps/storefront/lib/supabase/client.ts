'use client'
import { createBrowserClient } from '@supabase/ssr'

// Note: untyped client. Run `supabase gen types typescript` and pass the generated
// Database type as the generic to get full inference.

let _client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/storefront/.env.local',
    )
  }
  _client = createBrowserClient(url, key)
  return _client
}
