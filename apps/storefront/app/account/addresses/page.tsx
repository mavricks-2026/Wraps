import { createClient } from '@/lib/supabase/server'
import type { Address } from '@/lib/use-addresses'
import { AddressBook } from './AddressBook'
export const dynamic = 'force-dynamic'
export default async function AddressesPage() {
  const supabase = createClient()
  const { data, error } = await supabase.from('addresses').select('*').order('is_default', { ascending: false }).order('created_at', { ascending: false })
  const addresses = (data as Address[] | null) ?? []
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-display text-h2 font-semibold text-ink">Address book</h2>
        <p className="text-body-sm text-muted">Manage where we deliver your orders.</p>
      </div>
      {error ? (
        <p className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700">Could not load addresses: {error.message}</p>
      ) : (<AddressBook initialAddresses={addresses} />)}
    </div>
  )
}