// Stub: emails admins when inventory dips at/below reorder_level.
// Trigger via pg_cron or Supabase webhook on inventory updates.
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return new Response(
    JSON.stringify({ error: 'low-stock-alert not implemented yet' }),
    { status: 501, headers: { ...corsHeaders, 'content-type': 'application/json' } },
  )
})
