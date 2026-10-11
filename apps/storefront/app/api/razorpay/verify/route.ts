import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAdminClient } from '@/lib/supabase/admin'
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 })
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  const admin = getAdminClient()
  const { data: payment } = await admin.from('payments').select('id, order_id').eq('razorpay_order_id', razorpay_order_id).maybeSingle()
  if (!payment) return NextResponse.json({ ok: false, error: 'unknown_order' }, { status: 404 })
  const expected = crypto.createHmac('sha256', keySecret).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex')
  const valid = expected.length === razorpay_signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature))
  if (!valid) {
    await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id)
    await admin.from('orders').update({ status: 'cancelled' }).eq('id', payment.order_id)
    return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 400 })
  }
  await admin.from('payments').update({ status: 'paid', transaction_id: razorpay_payment_id, paid_at: new Date().toISOString() }).eq('id', payment.id)
  const { data: order } = await admin.from('orders').select('id, order_number, user_id, coupon_id').eq('id', payment.order_id).single()
  await admin.from('orders').update({ status: 'confirmed' }).eq('id', payment.order_id)
  if (order) { await admin.from('cart_items').delete().eq('user_id', order.user_id) }
  return NextResponse.json({ ok: true, orderNumber: order?.order_number })
}