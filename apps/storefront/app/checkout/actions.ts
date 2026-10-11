'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmationEmail, type OrderEmailItem } from '@/lib/email'

// ── Result types ────────────────────────────────────────────────
export type PlaceOrderInput = {
  addressId: string
  paymentMethod: 'cod' | 'online'
  couponCode?: string
  giftMessage?: string
}

export type PlaceOrderResult =
  | { ok: true; mode: 'cod'; orderNumber: string }
  | {
      ok: true
      mode: 'online'
      orderNumber: string
      razorpay: { orderId: string; amount: number; currency: 'INR'; keyId: string }
    }
  | { ok: false; error: string }

type CartRow = {
  variant_id: string
  quantity: number
  gift_wrap: boolean
  product_variants: { price: number; products: { name: string } | null } | null
}

// ── Helpers ─────────────────────────────────────────────────────
function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

async function releaseAll(
  admin: ReturnType<typeof getAdminClient>,
  reserved: { variantId: string; quantity: number }[],
) {
  for (const r of reserved) {
    await admin.rpc('release_inventory', { p_variant_id: r.variantId, p_quantity: r.quantity })
  }
}

// Round to two decimal places and return a number
function toTwoDecimals(n: number) {
  return Number(n.toFixed(2))
}

// ── Main action ─────────────────────────────────────────────────
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  // 1. Authenticate via the session client (RLS-bound).
  const session = createClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in to place an order.' }

  const admin = getAdminClient()

  // 2. Load the cart with variant prices + product names.
  const { data: cartData, error: cartErr } = await admin
    .from('cart_items')
    .select('variant_id, quantity, gift_wrap, product_variants!inner(price, products!inner(name))')
    .eq('user_id', user.id)
  if (cartErr) return { ok: false, error: 'Could not load your cart.' }
  const cart = (cartData ?? []) as unknown as CartRow[]
  if (cart.length === 0) return { ok: false, error: 'Your cart is empty.' }

  // 3. Validate the address belongs to this user.
  const { data: addr } = await admin
    .from('addresses')
    .select('id')
    .eq('id', input.addressId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!addr) return { ok: false, error: 'Please choose a valid delivery address.' }

  // 4. Subtotal.
  const subtotal = cart.reduce((s, l) => s + l.quantity * num(l.product_variants?.price), 0)

  // 5. Coupon (percent / flat; free_product treated as no-discount for MVP).
  let discount = 0
  let couponId: string | null = null
  const code = input.couponCode?.trim().toUpperCase()
  if (code) {
    const { data: coupon } = await admin
      .from('coupons')
      .select('id, type, value, min_order_value, max_uses, used_count, is_active, expires_at')
      .eq('code', code)
      .maybeSingle()
    if (!coupon || !coupon.is_active) return { ok: false, error: 'That coupon code is not valid.' }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return { ok: false, error: 'That coupon has expired.' }
    if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses)
      return { ok: false, error: 'That coupon has reached its usage limit.' }
    if (subtotal < num(coupon.min_order_value))
      return { ok: false, error: `Add more to your cart to use this coupon.` }
    if (coupon.type === 'percent') discount = Math.round((subtotal * num(coupon.value)) / 100)
    else if (coupon.type === 'flat') discount = Math.min(num(coupon.value), subtotal)
    // free_product: kept at discount 0 for MVP (gift-line handling is a later phase).
    couponId = coupon.id
  }

  // 6. Shipping (active method; free if subtotal clears free_above, or free_above = 0).
  const { data: ship } = await admin
    .from('shipping_methods')
    .select('id, base_fee, free_above, is_active')
    .eq('is_active', true)
    .order('base_fee', { ascending: true })
    .limit(1)
    .maybeSingle()
  const shippingMethodId: string | null = ship?.id ?? null
  const freeAbove = num(ship?.free_above)
  const shippingFee = !ship || freeAbove === 0 || subtotal >= freeAbove ? 0 : num(ship.base_fee)

  const total = Math.max(0, subtotal - discount + shippingFee)

  // 7. Reserve inventory (atomic per variant). Roll back on any shortfall.
  const reserved: { variantId: string; quantity: number }[] = []
  for (const line of cart) {
    const { data: ok, error } = await admin.rpc('reserve_inventory', {
      p_variant_id: line.variant_id,
      p_quantity: line.quantity,
    })
    if (error || ok === false) {
      await releaseAll(admin, reserved)
      return { ok: false, error: 'Sorry — one or more items just went out of stock.' }
    }
    reserved.push({ variantId: line.variant_id, quantity: line.quantity })
  }

  // 8. Order number + order row.
  const { data: orderNumber, error: numErr } = await admin.rpc('generate_order_number')
  if (numErr || !orderNumber) {
    await releaseAll(admin, reserved)
    return { ok: false, error: 'Could not generate an order number. Please try again.' }
  }

  const isGift = !!input.giftMessage?.trim() || cart.some((l) => l.gift_wrap)
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user.id,
      address_id: input.addressId,
      coupon_id: couponId,
      shipping_method_id: shippingMethodId,
      status: 'pending',
      is_gift: isGift,
      gift_message: input.giftMessage?.trim() || null,
      cod_requested: input.paymentMethod === 'cod',
      subtotal,
      discount_amt: discount,
      shipping_fee: shippingFee,
      total,
    })
    .select('id, order_number')
    .single()
  if (orderErr || !order) {
    await releaseAll(admin, reserved)
    return { ok: false, error: 'Could not create your order. Please try again.' }
  }

  // 9. Order items (price snapshot).
  // Defensive validation: ensure variants still exist and round prices to 2 decimals.
  const variantIds = cart.map((c) => c.variant_id)
  const { data: existingVariants } = await admin.from('product_variants').select('id').in('id', variantIds)
  const existingIds = new Set((existingVariants ?? []).map((v: any) => v.id))

  const missing = variantIds.filter((id) => !existingIds.has(id))
  if (missing.length > 0) {
    // Rollback order and reservations
    await admin.from('orders').delete().eq('id', order.id)
    await releaseAll(admin, reserved)
    return { ok: false, error: 'One or more items in your cart are no longer available. Please refresh your cart.' }
  }

  const items = cart.map((l) => {
    const unitPrice = toTwoDecimals(num(l.product_variants?.price))
    const quantity = Math.max(1, Math.floor(Number(l.quantity) || 0))
    const totalPrice = toTwoDecimals(unitPrice * quantity)
    return {
      order_id: order.id,
      variant_id: l.variant_id,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      gift_wrap: Boolean(l.gift_wrap),
    }
  })

  const { error: itemsErr } = await admin.from('order_items').insert(items)
  if (itemsErr) {
    try {
      console.error('Failed to insert order_items', { items, error: itemsErr })
    } catch (e) {
      // ignore logging errors
    }

    await admin.from('orders').delete().eq('id', order.id)
    await releaseAll(admin, reserved)
    return { ok: false, error: `Could not save order items. DB error: ${itemsErr.message ?? 'unknown'}` }
  }

  // 10. Payment row.
  await admin.from('payments').insert({
    order_id: order.id,
    method: input.paymentMethod,
    provider: input.paymentMethod === 'online' ? 'razorpay' : null,
    amount: total,
    is_cod: input.paymentMethod === 'cod',
    status: 'pending',
  })

  const emailItems: OrderEmailItem[] = cart.map((l) => ({
    name: l.product_variants?.products?.name ?? 'Item',
    quantity: l.quantity,
    unitPrice: num(l.product_variants?.price),
  }))

  // 11a. COD → confirm immediately, clear cart, bump coupon, email.
  if (input.paymentMethod === 'cod') {
    await admin.from('orders').update({ status: 'confirmed' }).eq('id', order.id)
    await admin.from('cart_items').delete().eq('user_id', user.id)
    if (couponId) await bumpCoupon(admin, couponId)
    await sendOrderConfirmationEmail({
      to: user.email ?? '',
      orderNumber: order.order_number,
      items: emailItems,
      subtotal,
      discount,
      shippingFee,
      total,
      paymentMethod: 'cod',
    })
    return { ok: true, mode: 'cod', orderNumber: order.order_number }
  }

  // 11b. Online → create Razorpay order; confirmation happens in /api/razorpay/verify.
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    await admin.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    await releaseAll(admin, reserved)
    return { ok: false, error: 'Online payment is not configured. Please choose Cash on Delivery.' }
  }
  const amountPaise = Math.round(total * 100)
  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      },
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: order.order_number }),
    })
    if (!res.ok) throw new Error(`Razorpay ${res.status}`)
    const rzp = (await res.json()) as { id: string }
    await admin.from('payments').update({ razorpay_order_id: rzp.id }).eq('order_id', order.id)
    return {
      ok: true,
      mode: 'online',
      orderNumber: order.order_number,
      razorpay: { orderId: rzp.id, amount: amountPaise, currency: 'INR', keyId },
    }
  } catch {
    await admin.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    await admin.from('payments').update({ status: 'failed' }).eq('order_id', order.id)
    await releaseAll(admin, reserved)
    return { ok: false, error: 'Could not start the payment. Please try again or use COD.' }
  }
}

async function bumpCoupon(admin: ReturnType<typeof getAdminClient>, couponId: string) {
  const { data } = await admin.from('coupons').select('used_count').eq('id', couponId).maybeSingle()
  if (data) await admin.from('coupons').update({ used_count: data.used_count + 1 }).eq('id', couponId)
}
