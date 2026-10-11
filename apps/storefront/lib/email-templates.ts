// Server-only HTML builders for transactional emails.
// No 'use client' — these are plain string builders used by lib/email.ts.

export type OrderEmailItem = {
  name: string
  variant?: string
  quantity: number
  unitPrice: number
}

export type OrderEmailParams = {
  to: string
  orderNumber: string
  items: OrderEmailItem[]
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  paymentMethod: 'cod' | 'online'
}
