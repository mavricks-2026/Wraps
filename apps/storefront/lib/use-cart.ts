'use client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSupabase } from '@/lib/supabase/client'
import type { CartLine } from '@goodsly/types'

const CART_KEY = ['cart'] as const

const CART_SELECT = `
  id,
  variant_id,
  quantity,
  gift_wrap,
  gift_message,
  product_variants:product_variants!inner(
    id,
    sku,
    color,
    size,
    price,
    products:products!inner(
      name,
      slug,
      product_images(url, is_primary)
    )
  )
` as const

async function fetchCart(): Promise<CartLine[]> {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('cart_items')
    .select(CART_SELECT)
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as CartLine[]
}

export function useCart() {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: fetchCart,
  })
}

async function requireUser() {
  const supabase = getSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to manage your cart')
  return { supabase, user }
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ variantId, quantity = 1 }: { variantId: string; quantity?: number }) => {
      const { supabase, user } = await requireUser()
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('variant_id', variantId)
        .maybeSingle()
      if (existing) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({ user_id: user.id, variant_id: variantId, quantity })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  })
}

export function useUpdateQuantity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { supabase } = await requireUser()
      if (quantity <= 0) {
        const { error } = await supabase.from('cart_items').delete().eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', id)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  })
}

export function useRemoveFromCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { supabase } = await requireUser()
      const { error } = await supabase.from('cart_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  })
}

export function useToggleGiftWrap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      gift_wrap,
      gift_message,
    }: {
      id: string
      gift_wrap: boolean
      gift_message?: string | null
    }) => {
      const { supabase } = await requireUser()
      const patch: { gift_wrap: boolean; gift_message?: string | null } = { gift_wrap }
      if (gift_message !== undefined) patch.gift_message = gift_message
      const { error } = await supabase.from('cart_items').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
  })
}
