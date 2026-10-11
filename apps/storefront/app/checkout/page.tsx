import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Address } from '@/lib/use-addresses'
import { CheckoutClient } from './CheckoutClient'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in?redirect=/checkout')

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display text-h1 font-semibold text-ink mb-8">Checkout</h1>
      <CheckoutClient addresses={(addresses ?? []) as Address[]} userEmail={user.email ?? ''} />
    </div>
  )
}
