'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatINR } from '@goodsly/utils'
import { getSupabase } from '@/lib/supabase/client'
import { OrderStatusBadge } from './OrderStatusBadge'
import type { Order } from '@/types/db'

interface Props {
  initial: Order[]
}

export function RealtimeOrders({ initial }: Props) {
  const [orders, setOrders] = useState<Order[]>(initial)

  useEffect(() => {
    const supabase = getSupabase()
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders((prev) => {
            if (payload.eventType === 'INSERT') {
              const inserted = payload.new as unknown as Order
              return [inserted, ...prev].slice(0, 20)
            }
            if (payload.eventType === 'UPDATE') {
              const updated = payload.new as unknown as Order
              return prev.map((o) => (o.id === updated.id ? updated : o))
            }
            if (payload.eventType === 'DELETE') {
              const deletedId = (payload.old as { id?: string }).id
              return prev.filter((o) => o.id !== deletedId)
            }
            return prev
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (orders.length === 0) {
    return (
      <div className="border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
        No orders yet. They'll appear here in real time as customers check out.
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
          <tr className="text-left">
            <th className="px-5 py-3 font-medium">Order</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Total</th>
            <th className="px-5 py-3 font-medium">Placed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-stone-50">
              <td className="px-5 py-3">
                <Link href={`/orders/${o.id}`} className="text-stone-900 font-medium hover:underline">
                  {o.order_number}
                </Link>
                {o.cod_requested && (
                  <span className="ml-2 inline-block text-[10px] uppercase tracking-wider text-amber-700">
                    COD
                  </span>
                )}
              </td>
              <td className="px-5 py-3">
                <OrderStatusBadge status={o.status} />
              </td>
              <td className="px-5 py-3 tabular">{formatINR(o.total)}</td>
              <td className="px-5 py-3 text-stone-600">
                {new Date(o.placed_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
