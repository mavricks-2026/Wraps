import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmationEmail, type OrderEmailItem } from '@/lib/email'

// Verifies a Razorpay payment after the client completes checkout, then
// confirms the order. Signature = HMAC_SHA256(`${order_id}|${payment_id}`,
// key_secret). This MUST run server-side with the secret; never trust the
// client's claim of success without it.

type Body = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  razorpay_signature?: string
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Body
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 })
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  const admin = getAdminClient()

  // Locate the payment + order this Razorpay order belongs to.
  const { data: payment } = await admin
    .from('payments')
    .select('id, order_id')
    .eq('razorpay_order_id', razorpay_order_id)
    .maybeSingle()
  if (!payment) return NextResponse.json({ ok: false, error: 'unknown_order' }, { status: 404 })

  // Constant-time signature comparison.
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))

  if (!valid) {
    // Bad signature → fail payment, cancel order, release reserved stock.
    const { data: failItems } = await admin
      .from('order_items')
      .select('variant_id, quantity')
      .eq('order_id', payment.order_id)
    for (const it of failItems ?? []) {
      await admin.rpc('release_inventory', { p_variant_id: it.variant_id, p_quantity: it.quantity })
    }
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    await admin.from('orders').update({ status: 'cancelled' }).eq('id', payment.order_id)
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 })
  }

  // Valid → mark paid, confirm order, clear cart, bump coupon.
  await admin
    .from('payments')
    .update({ status: 'paid', transaction_id: razorpay_payment_id, paid_at: new Date().toISOString() })
    .eq('id', payment.id)

  const { data: order } = await admin
    .from('orders')
    .select('id, order_number, user_id, coupon_id, subtotal, discount_amt, shipping_fee, total')
    .eq('id', payment.order_id)
    .single()

  await admin.from('orders').update({ status: 'confirmed' }).eq('id', payment.order_id)

  if (order) {
    await admin.from('cart_items').delete().eq('user_id', order.user_id)
    if (order.coupon_id) {
      const { data: c } = await admin
        .from('coupons')
        .select('used_count')
        .eq('id', order.coupon_id)
        .maybeSingle()
      if (c) await admin.from('coupons').update({ used_count: c.used_count + 1 }).eq('id', order.coupon_id)
    }

    // Best-effort confirmation email (never throws).
    try {
      const { data: items } = await admin
        .from('order_items')
        .select('quantity, unit_price, product_variants!inner(products!inner(name))')
        .eq('order_id', order.id)
      const { data: u } = await admin.auth.admin.getUserById(order.user_id)
      const emailItems: OrderEmailItem[] = (items ?? []).map((it: Record<string, unknown>) => ({
        name:
          (((it.product_variants as Record<string, unknown>)?.products as Record<string, unknown>)
            ?.name as string) ?? 'Item',
        quantity: it.quantity as number,
        unitPrice: num(it.unit_price),
      }))
      await sendOrderConfirmationEmail({
        to: u?.user?.email ?? '',
        orderNumber: order.order_number,
        items: emailItems,
        subtotal: num(order.subtotal),
        discount: num(order.discount_amt),
        shippingFee: num(order.shipping_fee),
        total: num(order.total),
        paymentMethod: 'online',
      })
    } catch {
      /* email failures must not break order confirmation */
    }
  }

  return NextResponse.json({ ok: true, orderNumber: order?.order_number })
}
