'use server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
export type PlaceOrderInput = { addressId: string; paymentMethod: 'cod' | 'online'; couponCode?: string; giftMessage?: string }
export type PlaceOrderResult = { ok: true; mode: 'cod'; orderNumber: string } | { ok: true; mode: 'online'; orderNumber: string; razorpay: { orderId: string; amount: number; currency: 'INR'; keyId: string } } | { ok: false; error: string }
function num(v: unknown): number { const n = typeof v === 'string' ? parseFloat(v) : (v as number); return Number.isFinite(n) ? n : 0 }
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const session = createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return { ok: false, error: 'Please sign in to place an order.' }
  const admin = getAdminClient()
  const { data: cartData, error: cartErr } = await admin.from('cart_items').select('variant_id, quantity, gift_wrap, product_variants!inner(price, products!inner(name))').eq('user_id', user.id)
  if (cartErr) return { ok: false, error: 'Could not load your cart.' }
  const cart = (cartData ?? []) as unknown as { variant_id: string; quantity: number; gift_wrap: boolean; product_variants: { price: number; products: { name: string } | null } | null }[]
  if (cart.length === 0) return { ok: false, error: 'Your cart is empty.' }
  const { data: addr } = await admin.from('addresses').select('id').eq('id', input.addressId).eq('user_id', user.id).maybeSingle()
  if (!addr) return { ok: false, error: 'Please choose a valid delivery address.' }
  const subtotal = cart.reduce((s, l) => s + l.quantity * num(l.product_variants?.price), 0)
  let discount = 0
  let couponId: string | null = null
  const code = input.couponCode?.trim().toUpperCase()
  if (code) {
    const { data: coupon } = await admin.from('coupons').select('id, type, value, min_order_value, max_uses, used_count, is_active, expires_at').eq('code', code).maybeSingle()
    if (!coupon || !coupon.is_active) return { ok: false, error: 'That coupon code is not valid.' }
    if (coupon.type === 'percent') discount = Math.round((subtotal * num(coupon.value)) / 100)
    else if (coupon.type === 'flat') discount = Math.min(num(coupon.value), subtotal)
    couponId = coupon.id
  }
  const { data: ship } = await admin.from('shipping_methods').select('id, base_fee, free_above, is_active').eq('is_active', true).order('base_fee', { ascending: true }).limit(1).maybeSingle()
  const shippingFee = !ship || num(ship?.free_above) === 0 || subtotal >= num(ship?.free_above) ? 0 : num(ship.base_fee)
  const total = Math.max(0, subtotal - discount + shippingFee)
  const { data: orderNumber } = await admin.rpc('generate_order_number')
  if (!orderNumber) return { ok: false, error: 'Could not generate an order number.' }
  const { data: order, error: orderErr } = await admin.from('orders').insert({ order_number: orderNumber, user_id: user.id, address_id: input.addressId, coupon_id: couponId, shipping_method_id: ship?.id ?? null, status: 'pending', is_gift: !!input.giftMessage?.trim(), gift_message: input.giftMessage?.trim() || null, cod_requested: input.paymentMethod === 'cod', subtotal, discount_amt: discount, shipping_fee: shippingFee, total }).select('id, order_number').single()
  if (orderErr || !order) return { ok: false, error: 'Could not create your order.' }
  const items = cart.map((l) => ({ order_id: order.id, variant_id: l.variant_id, quantity: l.quantity, unit_price: num(l.product_variants?.price), total_price: num(l.product_variants?.price) * l.quantity, gift_wrap: Boolean(l.gift_wrap) }))
  const { error: itemsErr } = await admin.from('order_items').insert(items)
  if (itemsErr) { await admin.from('orders').delete().eq('id', order.id); return { ok: false, error: 'Could not save order items.' } }
  await admin.from('payments').insert({ order_id: order.id, method: input.paymentMethod, provider: input.paymentMethod === 'online' ? 'razorpay' : null, amount: total, is_cod: input.paymentMethod === 'cod', status: 'pending' })
  if (input.paymentMethod === 'cod') {
    await admin.from('orders').update({ status: 'confirmed' }).eq('id', order.id)
    await admin.from('cart_items').delete().eq('user_id', user.id)
    return { ok: true, mode: 'cod', orderNumber: order.order_number }
  }
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) return { ok: false, error: 'Online payment is not configured.' }
  return { ok: true, mode: 'online', orderNumber: order.order_number, razorpay: { orderId: 'rzp_pending', amount: Math.round(total * 100), currency: 'INR', keyId } }
}