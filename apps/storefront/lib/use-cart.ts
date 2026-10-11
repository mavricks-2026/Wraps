'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import type { CartLine } from '@goodsly/types'

const CART_KEY = ['cart'] as const

export function useCart() {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase.from('cart_items').select('id').eq('user_id', user.id)
      if (error) throw error
      return (data ?? []) as unknown as CartLine[]
    },
  })
}
