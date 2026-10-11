'use client'
import { useCallback, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase/client'

export interface Address {
  id: string
  user_id: string
  full_name: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  country: string
  is_default: boolean
  created_at: string
}

export interface AddressInput {
  id?: string
  full_name: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state: string
  pincode: string
  country?: string
  is_default?: boolean
}

// Client-side hook to read the signed-in user's addresses (RLS scopes them to the user).
// Writes go through the server actions in app/account/addresses/actions.ts.
export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setAddresses((data as Address[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { addresses, loading, error, refresh }
}
