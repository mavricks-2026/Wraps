'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { getSupabase } from '@/lib/supabase/client'
export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrorMessage(error.message)
    else window.location.href = redirect
  }
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-h2 font-semibold text-ink">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
        <Button type="submit" size="lg" className="w-full">Log in</Button>
        {errorMessage && <p className="text-sm text-pink-strong">{errorMessage}</p>}
      </form>
    </div>
  )
}