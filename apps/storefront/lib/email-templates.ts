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

// Format a number as Indian Rupees, e.g. 12500 -> "Rs12,500".
function inr(n: number): string {
  const safe = Number.isFinite(n) ? n : 0
  return `Rs${safe.toLocaleString('en-IN')}`
}

// Basic HTML-escaping so item names / variants can't break the markup.
function esc(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function itemRows(items: OrderEmailItem[]): string {
  return items
    .map((item) => {
      const lineTotal = item.unitPrice * item.quantity
      const variant = item.variant
        ? `<div style="color:#6b7280;font-size:13px;margin-top:2px;">${esc(item.variant)}</div>`
        : ''
      return `
        <tr>
          <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top;">
            <div style="color:#111827;font-size:14px;font-weight:600;">${esc(item.name)}</div>
            ${variant}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;text-align:center;color:#374151;font-size:14px;vertical-align:top;">
            ${item.quantity}
          </td>
          <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;text-align:right;color:#111827;font-size:14px;font-weight:600;vertical-align:top;white-space:nowrap;">
            ${inr(lineTotal)}
          </td>
        </tr>`
    })
    .join('')
}

function summaryRow(label: string, value: string, opts?: { bold?: boolean; muted?: boolean }): string {
  const weight = opts?.bold ? '700' : '400'
  const size = opts?.bold ? '16px' : '14px'
  const color = opts?.muted ? '#059669' : '#111827'
  const labelColor = opts?.bold ? '#111827' : '#6b7280'
  return `
    <tr>
      <td style="padding:6px 8px;color:${labelColor};font-size:${size};font-weight:${weight};">${esc(label)}</td>
      <td style="padding:6px 8px;text-align:right;color:${color};font-size:${size};font-weight:${weight};white-space:nowrap;">${value}</td>
    </tr>`
}

export function renderOrderConfirmationEmail(params: OrderEmailParams): string {
  const { orderNumber, items, subtotal, discount, shippingFee, total, paymentMethod } = params
  const paymentLine = paymentMethod === 'cod' ? 'Pay on delivery' : 'Paid online'
  const discountRow = discount > 0 ? summaryRow('Discount', `- ${inr(discount)}`, { muted: true }) : ''
  const shippingRow = shippingFee > 0 ? summaryRow('Shipping', inr(shippingFee)) : summaryRow('Shipping', 'Free')
  return `Order ${esc(orderNumber)} total ${inr(total)} payment ${esc(paymentLine)} items ${itemRows(items)} sub ${inr(subtotal)} ${discountRow} ${shippingRow}`
}
