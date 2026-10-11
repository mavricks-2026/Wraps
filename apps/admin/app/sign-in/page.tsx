'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, Input } from '@goodsly/ui'
import { getSupabase } from '@/lib/supabase/client'

const ERRORS: Record<string, string> = {
  not_admin: 'That account is not an admin. Sign in with an admin email.',
  inactive: 'That account is deactivated. Contact a superadmin.',
}

function SignInForm() {
  const params = useSearchParams()
  const errorParam = params.get('error')
  const redirect = params.get('redirect') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setMessage(null)
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setPending(false)
      setMessage(error.message)
      return
    }
    // Session cookies are set by @supabase/ssr automatically.
    // Hard-navigate so the server middleware re-runs with the new cookies.
    window.location.href = redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md bg-white shadow-sm border border-stone-200 p-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-2">Goodsly</p>
          <h1 className="font-serif text-3xl text-stone-900">Admin sign-in</h1>
          <p className="text-sm text-stone-600 mt-2">Authorised staff only.</p>
        </div>

        {errorParam && ERRORS[errorParam] && (
          <p className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">
            {ERRORS[errorParam]}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider text-stone-500 mb-2"
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
              placeholder="admin@goodsly.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs uppercase tracking-wider text-stone-500 mb-2"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? 'Signing in…' : 'Sign in'}
          </Button>
          {message && <p className="text-sm text-red-600">{message}</p>}
        </form>

        <p className="text-xs text-stone-500 border-t border-stone-200 pt-4">
          Admin accounts are provisioned by a superadmin in the Supabase dashboard. If you've lost
          your password, ask a superadmin to reset it.
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  )
}
