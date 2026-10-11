import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const navLinks = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
]

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in?redirect=/account')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-pink">Your space</p>
      <h1 className="mb-10 font-display text-h2 font-semibold text-ink">My account</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
        <nav aria-label="Account" className="md:border-r md:border-line md:pr-6">
          <ul className="flex gap-1 overflow-x-auto no-scrollbar md:flex-col">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-soft hover:text-plum"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
