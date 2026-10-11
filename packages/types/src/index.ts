export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'

export type UserRole = 'customer' | 'admin' | 'staff'
export type CouponType = 'percent' | 'flat' | 'free_product'
export type PaymentMethod = 'online' | 'cod'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

// ─────────────────────────────────────────────
// Catalog row shapes (subset used by storefront MVP)
// ─────────────────────────────────────────────

export interface Category {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export interface ProductImage {
  id: string
  url: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

export interface InventorySnapshot {
  qty_available: number
  qty_reserved: number
}

export interface ProductVariant {
  id: string
  sku: string
  color: string | null
  size: string | null
  price: number
  compare_price: number | null
  is_active: boolean
  inventory?: InventorySnapshot | InventorySnapshot[] | null
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  material: string | null
  care_instructions: string | null
  base_price: number
  compare_price: number | null
  is_active: boolean
  is_featured: boolean
  is_just_in: boolean
  is_gift_packable: boolean
  product_images?: ProductImage[]
  product_variants?: ProductVariant[]
}

// ─────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────

export interface CartLine {
  id: string
  variant_id: string
  quantity: number
  gift_wrap: boolean
  gift_message: string | null
  product_variants: {
    id: string
    sku: string
    color: string | null
    size: string | null
    price: number
    products: {
      name: string
      slug: string
      product_images: { url: string; is_primary: boolean }[]
    }
  }
}

// ─────────────────────────────────────────────
// Orders (full type kept for later phases)
// ─────────────────────────────────────────────

export interface OrderWithItems {
  id: string
  order_number: string
  status: OrderStatus
  is_gift: boolean
  gift_message: string | null
  cod_requested: boolean
  subtotal: number
  discount_amt: number
  shipping_fee: number
  total: number
  placed_at: string
  order_items: {
    id: string
    quantity: number
    unit_price: number
    total_price: number
    product_variants: {
      sku: string
      color: string | null
      size: string | null
      products: { name: string; slug: string }
    }
  }[]
  addresses: {
    full_name: string
    line1: string
    city: string
    state: string
    pincode: string
  }
  payments: {
    method: PaymentMethod
    status: PaymentStatus
    is_cod: boolean
  }
}