'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { getSupabase } from '@/lib/supabase/client'
export default function SignupPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setErrorMessage('Passwords do not match.'); return }
    if (password.length < 8) { setErrorMessage('Password must be at least 8 characters.'); return }
    try {
      const supabase = getSupabase()
      const callback = window.location.origin + '/auth/callback?next=' + encodeURIComponent(redirect)
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback } })
      if (error) setErrorMessage(error.message)
      else if (data.session) window.location.href = redirect
    } catch { setErrorMessage("Can't reach the sign-up service.") }
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-h2 font-semibold text-ink">Create account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" />
        <Button type="submit" size="lg" className="w-full">Create account</Button>
        {errorMessage && <p className="text-sm text-pink-strong">{errorMessage}</p>}
      </form>
      <p className="mt-6 text-center text-body-sm text-muted">Have an account? <Link href={'/login?redirect=' + encodeURIComponent(redirect)} className="font-semibold text-plum">Log in</Link></p>
    </div>
  )
}