'use client'
import { useState } from 'react'

export function NewsletterCta() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (email.trim()) setDone(true)
      }}
      className="mx-auto flex w-full max-w-md flex-col items-center gap-3 sm:flex-row"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-12 w-full rounded-control border border-line bg-white px-4 text-sm text-ink placeholder:text-muted/60 focus:border-pink focus:outline-none"
      />
      <button
        type="submit"
        disabled={done}
        className="h-12 w-full flex-shrink-0 rounded-full bg-pink px-7 text-sm font-semibold text-white transition-colors hover:bg-plum disabled:opacity-70 sm:w-auto"
      >
        {done ? 'You’re in!' : 'Claim 10% Off'}
      </button>
    </form>
  )
}
