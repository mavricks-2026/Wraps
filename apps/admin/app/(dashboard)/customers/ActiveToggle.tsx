'use client'
import { useState, useTransition } from 'react'
import { Button } from '@goodsly/ui'
import { setCustomerActive } from './actions'

interface Props {
  customerId: string
  isActive: boolean
  role: 'customer' | 'admin' | 'staff'
}

export function ActiveToggle({ customerId, isActive, role }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Admins are shown but cannot be deactivated (server enforces this too).
  if (role === 'admin') {
    return (
      <p className="text-sm text-stone-500">
        Admin accounts cannot be suspended.
      </p>
    )
  }

  function run() {
    setError(null)
    startTransition(async () => {
      const res = await setCustomerActive(customerId, !isActive)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant={isActive ? 'outline' : 'primary'}
        onClick={run}
        disabled={pending}
      >
        {isActive ? 'Suspend account' : 'Reactivate account'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
