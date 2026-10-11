'use client'
import { useState, useTransition } from 'react'
import { Button, Input } from '@/components/ui'
import type { Address, AddressInput } from '@/lib/use-addresses'
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from './actions'

interface Props {
  initialAddresses: Address[]
}

export function AddressBook({ initialAddresses }: Props) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const addresses = initialAddresses

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-muted">
          {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
        </p>
        {!adding && addresses.length > 0 && (
          <Button size="sm" onClick={() => setAdding(true)}>
            + Add address
          </Button>
        )}
      </div>

      {adding && (
        <div className="rounded-card border border-line bg-tint p-6 shadow-card">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">New address</h3>
          <AddressForm onClose={() => setAdding(false)} />
        </div>
      )}

      {addresses.length === 0 && !adding ? (
        <div className="rounded-card border border-line bg-surface px-6 py-14 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-soft">
            <span className="msym msym-filled text-[28px] text-pink" aria-hidden>
              location_on
            </span>
          </div>
          <h3 className="font-display text-lg font-semibold text-ink">No addresses yet</h3>
          <p className="mt-1 text-body-sm text-muted">Add one to speed up checkout.</p>
          <div className="mt-5">
            <Button size="sm" onClick={() => setAdding(true)}>
              + Add address
            </Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((addr) =>
            editingId === addr.id ? (
              <li key={addr.id} className="rounded-card border border-line bg-tint p-6 shadow-card">
                <h3 className="mb-4 font-display text-lg font-semibold text-ink">Edit address</h3>
                <AddressForm address={addr} onClose={() => setEditingId(null)} />
              </li>
            ) : (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => setEditingId(addr.id)}
              />
            ),
          )}
        </ul>
      )}
    </section>
  )
}

function AddressCard({
  address,
  onEdit,
}: {
  address: Address
  onEdit: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function remove() {
    if (!confirm('Delete this address?')) return
    setError(null)
    startTransition(async () => {
      const res = await deleteAddress(address.id)
      if (!res.ok) setError(res.error)
    })
  }

  function makeDefault() {
    setError(null)
    startTransition(async () => {
      const res = await setDefaultAddress(address.id)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <li className="rounded-card border border-line bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5 text-body-sm text-muted">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-ink">{address.full_name}</span>
            {address.is_default && (
              <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-plum">
                Default
              </span>
            )}
          </div>
          <p>{address.phone}</p>
          <p>{address.line1}</p>
          {address.line2 && <p>{address.line2}</p>}
          <p>
            {address.city}, {address.state} {address.pincode}
          </p>
          <p>{address.country}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit} disabled={pending}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
              Delete
            </Button>
          </div>
          {!address.is_default && (
            <Button size="sm" variant="ghost" onClick={makeDefault} disabled={pending}>
              Set as default
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </li>
  )
}

function AddressForm({
  address,
  onClose,
}: {
  address?: Address
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fullName, setFullName] = useState(address?.full_name ?? '')
  const [phone, setPhone] = useState(address?.phone ?? '')
  const [line1, setLine1] = useState(address?.line1 ?? '')
  const [line2, setLine2] = useState(address?.line2 ?? '')
  const [city, setCity] = useState(address?.city ?? '')
  const [stateValue, setStateValue] = useState(address?.state ?? '')
  const [pincode, setPincode] = useState(address?.pincode ?? '')
  const [isDefault, setIsDefault] = useState(address?.is_default ?? false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Pincode must be 6 digits')
      return
    }

    const payload: AddressInput = {
      id: address?.id,
      full_name: fullName,
      phone,
      line1,
      line2: line2 || null,
      city,
      state: stateValue,
      pincode,
      country: address?.country ?? 'IN',
      is_default: isDefault,
    }

    startTransition(async () => {
      const res = address ? await updateAddress(payload) : await createAddress(payload)
      if (!res.ok) {
        setError(res.error)
        return
      }
      onClose()
    })
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Full name" required>
        <Input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Recipient name"
        />
      </Field>
      <Field label="Phone" required>
        <Input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="98765 43210"
        />
      </Field>
      <Field label="Address line 1" required className="sm:col-span-2">
        <Input
          required
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          placeholder="House no., street, area"
        />
      </Field>
      <Field label="Address line 2" className="sm:col-span-2">
        <Input
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Landmark, apartment (optional)"
        />
      </Field>
      <Field label="City" required>
        <Input required value={city} onChange={(e) => setCity(e.target.value)} />
      </Field>
      <Field label="State" required>
        <Input
          required
          value={stateValue}
          onChange={(e) => setStateValue(e.target.value)}
          placeholder="e.g. Karnataka"
        />
      </Field>
      <Field label="Pincode" required>
        <Input
          required
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          placeholder="560001"
        />
      </Field>
      <Field label="Country">
        <Input value="India" disabled readOnly />
      </Field>

      <label className="flex items-center gap-2 text-body-sm text-muted sm:col-span-2">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="accent-pink h-4 w-4"
        />
        Set as default delivery address
      </label>

      {error && (
        <p className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700 sm:col-span-2">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Saving…' : address ? 'Save address' : 'Add address'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  className,
  children: React.ReactNode
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </span>
      {children}
    </label>
  )
}
