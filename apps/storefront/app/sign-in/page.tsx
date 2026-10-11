'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { getSupabase } from '@/lib/supabase/client'
export default function SignInPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const supabase = getSupabase()
      const callback = window.location.origin + '/auth/callback?next=' + encodeURIComponent(redirect)
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callback } })
      if (error) { setStatus('error'); setErrorMessage(error.message) }
      else setStatus('sent')
    } catch { setStatus('error'); setErrorMessage("Can't reach the sign-in service.") }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-h2 font-semibold text-ink">Sign in</h1>
      {status === 'sent' ? (<p className="mt-4 text-sm">Check your email for a sign-in link.</p>) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send magic link'}</Button>
          {errorMessage && <p className="text-sm text-pink-strong">{errorMessage}</p>}
        </form>
      )}
      <p className="mt-6 text-center text-body-sm text-muted">New here? <Link href={'/signup?redirect=' + encodeURIComponent(redirect)} className="font-semibold text-plum">Create an account</Link></p>
    </div>
  )
}