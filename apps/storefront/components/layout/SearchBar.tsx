'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const router = useRouter()
  const [q, setQ] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    router.push(`/search?q=${encodeURIComponent(term)}`)
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="hidden items-center gap-2 rounded-full border border-transparent bg-tint px-4 transition-colors focus-within:border-pink/40 focus-within:bg-white sm:flex"
    >
      <span className="msym text-[18px] text-muted" aria-hidden>
        search
      </span>
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search gifts…"
        aria-label="Search products"
        className="h-10 w-36 bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none lg:w-52"
      />
    </form>
  )
}
