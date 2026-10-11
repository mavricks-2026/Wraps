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

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMessage(null)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setStatus('error')
        setErrorMessage(friendlyAuthError(error.message))
      } else {
        window.location.href = redirect
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
          <h1 className="font-display text-h2 font-semibold text-ink">Log in</h1>
          <p className="mt-2 text-body-sm text-muted">
            Welcome back — sign in to your gift shelf.
          </p>
        </div>

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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={status === 'sending'}>
            {status === 'sending' ? 'Logging in…' : 'Log in'}
          </Button>
          {errorMessage && <p className="text-sm text-pink-strong">{errorMessage}</p>}
        </form>

        <div className="mt-6 space-y-2 text-center text-body-sm text-muted">
          <p>
            New here?{' '}
            <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-plum hover:text-pink">
              Create an account
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
