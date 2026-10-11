// Stub: sends order confirmation / shipping update emails via Resend.
// Wired up in a later phase. Returns 501 for now.
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return new Response(
    JSON.stringify({ error: 'send-order-email not implemented yet' }),
    { status: 501, headers: { ...corsHeaders, 'content-type': 'application/json' } },
  )
})
