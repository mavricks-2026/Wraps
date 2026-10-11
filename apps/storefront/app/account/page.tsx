import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'

export const dynamic = 'force-dynamic'

const cards = [
  {
    href: '/account/orders',
    title: 'Orders',
    description: 'Track shipments and review past purchases.',
  },
  {
    href: '/account/addresses',
    title: 'Addresses',
    description: 'Manage your delivery addresses.',
  },
  {
    href: '/account/wishlist',
    title: 'Wishlist',
    description: 'Items you have saved for later.',
  },
]

export default async function AccountOverviewPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?redirect=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const greetingName = (profile?.full_name as string | null)?.trim() || user.email

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-1 font-display text-h2 font-semibold text-ink">Hello, {greetingName}</h2>
        <p className="text-body-sm text-muted">
          Signed in as <span className="text-ink">{user.email}</span>
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block rounded-card border border-line bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
          >
            <h3 className="mb-1 font-display text-lg font-semibold text-ink">{card.title}</h3>
            <p className="text-body-sm text-muted">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-card border border-line bg-surface shadow-card">
        <header className="border-b border-line px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">Profile details</h3>
        </header>
        <div className="p-6">
          <ProfileForm
            fullName={(profile?.full_name as string | null) ?? ''}
            phone={(profile?.phone as string | null) ?? ''}
          />
        </div>
      </section>
    </div>
  )
}