// Stub: deactivates expired coupons.
// Note: schema.sql already schedules this via pg_cron daily — this function exists
// for ad-hoc invocation or if you migrate off pg_cron later.
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return new Response(
    JSON.stringify({ error: 'expire-coupons not implemented yet' }),
    { status: 501, headers: { ...corsHeaders, 'content-type': 'application/json' } },
  )
})
