// Server-only module: no 'use client' directive, and it reads the
// RESEND_API_KEY server secret — never import this from a Client Component.
import {
  renderOrderConfirmationEmail,
  type OrderEmailItem,
  type OrderEmailParams,
} from './email-templates'

export type { OrderEmailItem, OrderEmailParams }

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

// IMPORTANT: the `WrapUrs.store` domain must be verified in Resend
// (SPF + DKIM DNS records configured) for this `from` address to deliver.
// Until the domain is verified, Resend will reject these sends.
const FROM_ADDRESS = 'WrapUrs <orders@WrapUrs.store>'

/**
 * Send the order-confirmation email via the Resend HTTP API.
 *
 * This function NEVER throws. The checkout flow can call it without a
 * try/catch — a missing API key or a Resend error is logged and swallowed
 * so the order is never blocked by email delivery.
 */
export async function sendOrderConfirmationEmail(params: OrderEmailParams): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      // No-op when the key is unset/empty so the order flow is never blocked.
      console.warn(
        '[email] RESEND_API_KEY is not set — skipping order confirmation email.'
      )
      return
    }

    const html = renderOrderConfirmationEmail(params)

    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: params.to,
        subject: `Order confirmed — ${params.orderNumber}`,
        html,
      }),
      // Email is fire-and-forget; never cache.
      cache: 'no-store',
    })

    if (!res.ok) {
      let detail = ''
      try {
        detail = await res.text()
      } catch {
        // ignore body read failures
      }
      console.error(
        `[email] Resend API error (${res.status} ${res.statusText}) for order ${params.orderNumber}: ${detail}`
      )
      return
    }
  } catch (err) {
    // Catch network errors, JSON errors, anything — never block checkout.
    console.error('[email] Failed to send order confirmation email:', err)
    return
  }
}
