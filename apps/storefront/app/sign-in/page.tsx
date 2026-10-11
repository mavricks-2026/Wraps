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

export default function SignInPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMessage(null)
    try {
      const supabase = getSupabase()
      const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callback },
      })
      if (error) {
        setStatus('error')
        setErrorMessage(friendlyAuthError(error.message))
      } else {
        setStatus('sent')
      }
    } catch {
      setStatus('error')
      setErrorMessage("Can't reach the sign-in service. Please try again.")
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
          <h1 className="font-display text-h2 font-semibold text-ink">Sign in</h1>
          <p className="mt-2 text-body-sm text-muted">
            Enter your email and we'll send you a magic link.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="rounded-control border border-line bg-tint px-4 py-6 text-sm">
            <p className="mb-1 font-semibold text-ink">Check your email.</p>
            <p className="text-muted">
              We sent a sign-in link to <strong className="text-ink">{email}</strong>. Click it to
              continue.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs uppercase tracking-wider text-muted"
                >
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
              <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send magic link'}
              </Button>
              {errorMessage && <p className="text-sm text-pink-strong">{errorMessage}</p>}
            </form>
            <div className="mt-6 space-y-2 text-center text-body-sm text-muted">
              <p>
                Want a password?{' '}
                <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-plum hover:text-pink">
                  Log in
                </Link>
              </p>
              <p>
                New to WrapUrs?{' '}
                <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-plum hover:text-pink">
                  Create an account
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
