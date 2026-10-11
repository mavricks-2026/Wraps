'use client'
import { useState } from 'react'
import { Button } from '@/components/ui'
import type { Address } from '@/lib/use-addresses'
export function AddressBook({ initialAddresses }: { initialAddresses: Address[] }) {
  return (
    <section className="space-y-4">
      <p>{initialAddresses.length} saved addresses</p>
      <ul>{initialAddresses.map((a) => (<li key={a.id}>{a.full_name}</li>))}</ul>
    </section>
  )
}
