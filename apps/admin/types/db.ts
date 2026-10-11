// Minimal db types for the admin app.
// Replace with `supabase gen types typescript` output when the CLI is wired.

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export interface Order {
  id: string
  order_number: string
  user_id: string
  status: OrderStatus
  is_gift: boolean
  cod_requested: boolean
  subtotal: number
  discount_amt: number
  shipping_fee: number
  total: number
  placed_at: string
}

export interface OrderItem {
  id: string
  variant_id: string
  quantity: number
  unit_price: number
  total_price: number
  gift_wrap: boolean
}

export interface OrderStatusLog {
  id: string
  status: OrderStatus
  note: string | null
  created_at: string
}

export interface InventoryRow {
  id: string
  variant_id: string
  qty_available: number
  qty_reserved: number
  qty_sold: number
  reorder_level: number
  updated_at: string
}

export interface Coupon {
  id: string
  code: string
  description: string | null
  type: 'percent' | 'flat' | 'free_product'
  value: number | null
  free_product_id: string | null
  min_order_value: number
  max_uses: number | null
  used_count: number
  is_active: boolean
  expires_at: string | null
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  title: string | null
  body: string | null
  is_verified_purchase: boolean
  is_approved: boolean
  created_at: string
}
