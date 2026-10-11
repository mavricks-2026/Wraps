'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { getSupabase } from '@/lib/supabase/client'

function friendlyAuthError(message: string): string {
  return /fetch|network|failed to/i.test(message)
    ? "Can't reach the sign-in service. Please try again."
    : message
}

export default function SignupPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setStatus('error')
      setErrorMessage('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setStatus('error')
      setErrorMessage('Password must be at least 8 characters.')
      return
    }
    setStatus('sending')
    setErrorMessage(null)
    try {
      const supabase = getSupabase()
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callback },
      })
      if (error) {
        setStatus('error')
        setErrorMessage(friendlyAuthError(error.message))
      } else if (data.session) {
        // Email confirmations disabled — signed in immediately.
        window.location.href = redirect
      } else {
        setStatus('sent')
      }
    } catch {
      setStatus('error')
      setErrorMessage("Can't reach the sign-up service. Please try again.")
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-card border border-line bg-surface p-8 shadow-card">
        <div className="mb-6 text-center">
          <Image
            src="/logo-emblem.png"
            alt=""
            width={264}
            height={256}
            className="mx-auto mb-4 h-12 w-auto"
            priority
          />
          <h1 className="font-display text-h2 font-semibold text-ink">Create account</h1>
          <p className="mt-2 text-body-sm text-muted">
            Save favorites, track orders, and check out faster.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="rounded-control border border-line bg-tint px-4 py-6 text-sm">
            <p className="mb-1 font-semibold text-ink">Check your email.</p>
            <p className="text-muted">
              We sent a confirmation link to <strong className="text-ink">{email}</strong>. Click
              it to activate your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs uppercase tracking-wider text-muted">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-xs uppercase tracking-wider text-muted">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-xs uppercase tracking-wider text-muted">
                Confirm password
              </label>
              <Input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
              {status === 'sending' ? 'Creating account…' : 'Create account'}
            </Button>
            {errorMessage && <p className="text-sm text-pink-strong">{errorMessage}</p>}
          </form>
        )}

        <div className="mt-6 space-y-2 text-center text-body-sm text-muted">
          <p>
            Already have an account?{' '}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-plum hover:text-pink">
              Log in
            </Link>
          </p>
          <p>
            Prefer email links?{' '}
            <Link href={`/sign-in?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-plum hover:text-pink">
              Send a magic link
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
