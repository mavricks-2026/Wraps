'use client'
import { createBrowserClient } from '@supabase/ssr'

let _client: ReturnType<typeof createBrowserClient> | null = null

export function getSupabase() {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Missing Supabase env in admin app')
  }
  _client = createBrowserClient(url, key)
  return _client
}
