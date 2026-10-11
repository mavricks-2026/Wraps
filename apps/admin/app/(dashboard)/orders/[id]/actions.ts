'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import type { OrderStatus } from '@/types/db'

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
}

export async function changeOrderStatus(
  orderId: string,
  next: OrderStatus,
  note?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAdmin()
  const admin = getAdminClient()

  const { data: order, error: fetchError } = await admin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .maybeSingle()

  if (fetchError) return { ok: false, error: fetchError.message }
  if (!order) return { ok: false, error: 'Order not found' }

  const current = order.status as OrderStatus
  if (!VALID_TRANSITIONS[current].includes(next)) {
    return {
      ok: false,
      error: `Cannot transition ${current} → ${next}`,
    }
  }

  const { error: updateError } = await admin
    .from('orders')
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (updateError) return { ok: false, error: updateError.message }

  // log entry — schema has an AFTER UPDATE trigger that already inserts a row,
  // but we override with a note attached to *this* admin's action.
  if (note) {
    await admin.from('order_status_logs').insert({
      order_id: orderId,
      status: next,
      note,
      changed_by: session.userId,
    })
  }

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  revalidatePath('/')
  return { ok: true }
}
