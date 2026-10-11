import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Behind a reverse proxy (Traefik) the `next start -H 0.0.0.0` server reports
  // its bind address (0.0.0.0:3100) as the request origin, so redirects would
  // point there. Use the forwarded host/proto to rebuild the real public origin.
  const fwdHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const fwdProto = request.headers.get('x-forwarded-proto') ?? 'https'
  const base = fwdHost ? `${fwdProto}://${fwdHost}` : origin

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${base}${next}`)
    }
  }

  return NextResponse.redirect(`${base}/sign-in?error=callback_failed`)
}
