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

// Format a number as Indian Rupees, e.g. 12500 -> "₹12,500".
function inr(n: number): string {
  const safe = Number.isFinite(n) ? n : 0
  return `₹${safe.toLocaleString('en-IN')}`
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

  const paymentLine =
    paymentMethod === 'cod' ? 'Pay on delivery' : 'Paid online'

  const discountRow =
    discount > 0 ? summaryRow('Discount', `- ${inr(discount)}`, { muted: true }) : ''

  const shippingRow =
    shippingFee > 0 ? summaryRow('Shipping', inr(shippingFee)) : summaryRow('Shipping', 'Free')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#111827;padding:24px 32px;">
              <span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">WrapUrs</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Order confirmed 🎉</h1>
              <p style="margin:0 0 4px;color:#374151;font-size:15px;line-height:1.5;">
                Thanks for shopping with us! We've received your order and it's being processed.
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
                Order number: <strong style="color:#111827;">${esc(orderNumber)}</strong>
              </p>

              <!-- Items -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr>
                    <th align="left" style="padding:8px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
                    <th align="center" style="padding:8px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                    <th align="right" style="padding:8px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows(items)}
                </tbody>
              </table>

              <!-- Summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;">
                ${summaryRow('Subtotal', inr(subtotal))}
                ${discountRow}
                ${shippingRow}
                <tr><td colspan="2" style="padding:4px 8px;"><div style="border-top:1px solid #e5e7eb;"></div></td></tr>
                ${summaryRow('Total', inr(total), { bold: true })}
              </table>

              <!-- Payment -->
              <div style="margin-top:24px;padding:14px 16px;background-color:#f9fafb;border-radius:8px;">
                <span style="color:#6b7280;font-size:13px;">Payment method</span>
                <div style="color:#111827;font-size:15px;font-weight:600;margin-top:2px;">${esc(paymentLine)}</div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #f0f0f0;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:13px;line-height:1.5;">
                Need help? Just reply to this email and we'll be happy to assist.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} WrapUrs. Thanks for being awesome.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

