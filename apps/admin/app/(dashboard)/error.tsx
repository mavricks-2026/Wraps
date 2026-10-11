'use client'
import { useEffect } from 'react'
import { Button } from '@goodsly/ui'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Dashboard error:', error)
  }, [error])

  const isMissingServiceRole = error.message.includes('SUPABASE_SERVICE_ROLE_KEY')

  if (isMissingServiceRole) {
    return (
      <div className="px-8 py-12 max-w-2xl">
        <h1 className="font-serif text-3xl text-stone-900 mb-2">One more setup step</h1>
        <p className="text-stone-600 mb-6">
          The admin dashboard reads catalog and order data using the Supabase{' '}
          <strong>service-role</strong> key. Without it, queries fail because RLS blocks reading
          other users' data.
        </p>

        <ol className="list-decimal list-inside space-y-2 text-sm text-stone-700 mb-6">
          <li>
            Open{' '}
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noreferrer"
              className="underline text-stone-900"
            >
              Supabase Dashboard → Project Settings → API
            </a>
          </li>
          <li>
            Copy the value under <strong>Project API keys → service_role</strong> (the one labeled{' '}
            <em>secret</em>, not the anon key)
          </li>
          <li>
            Paste it into <code className="bg-stone-100 px-1.5 py-0.5">apps/admin/.env.local</code>:
            <pre className="bg-stone-900 text-stone-50 px-3 py-2 mt-2 text-xs overflow-x-auto">
              SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
            </pre>
          </li>
          <li>Restart the admin dev server (Ctrl+C, then `pnpm dev:admin`)</li>
        </ol>

        <Button onClick={reset}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="px-8 py-12 max-w-2xl">
      <h1 className="font-serif text-3xl text-stone-900 mb-2">Something went wrong</h1>
      <p className="text-stone-600 mb-1">{error.message}</p>
      {error.digest && <p className="text-xs text-stone-400 mb-6">digest: {error.digest}</p>}
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
