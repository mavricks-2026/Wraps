'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'

const WISHLIST_KEY = ['wishlist'] as const

const WISHLIST_SELECT = `
  id,
  product_id,
  added_at,
  products:products!inner(
    id,
    name,
    slug,
    base_price,
    compare_price,
    product_images(url, alt_text, is_primary, sort_order)
  )
` as const

export interface WishlistItem {
  id: string
  product_id: string
  added_at: string
  products: {
    id: string
    name: string
    slug: string
    base_price: number
    compare_price: number | null
    product_images: {
      url: string
      alt_text: string | null
      is_primary: boolean
      sort_order: number
    }[]
  }
}

async function fetchWishlist(): Promise<WishlistItem[]> {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('wishlists')
    .select(WISHLIST_SELECT)
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as WishlistItem[]
}

export function useWishlist() {
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: fetchWishlist,
  })
}

/** Returns whether a given product is in the current user's wishlist. */
export function useIsWishlisted(productId: string) {
  const { data, isLoading } = useWishlist()
  return {
    isWishlisted: (data ?? []).some((w) => w.product_id === productId),
    isLoading,
  }
}

async function requireUser() {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to save to your wishlist')
  return { supabase, user }
}

export function useAddToWishlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (productId: string) => {
      const { supabase, user } = await requireUser()
      const { error } = await supabase
        .from('wishlists')
        .upsert(
          { user_id: user.id, product_id: productId },
          { onConflict: 'user_id,product_id', ignoreDuplicates: true },
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WISHLIST_KEY }),
  })
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (productId: string) => {
      const { supabase, user } = await requireUser()
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: WISHLIST_KEY }),
  })
}
