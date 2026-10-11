// Stub: sends OTP SMS via MSG91. Wired up in a later phase.
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return new Response(
    JSON.stringify({ error: 'send-otp-sms not implemented yet' }),
    { status: 501, headers: { ...corsHeaders, 'content-type': 'application/json' } },
  )
})
