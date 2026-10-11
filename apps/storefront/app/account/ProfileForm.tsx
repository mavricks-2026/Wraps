'use client'
import { useState, useTransition } from 'react'
import { Button, Input } from '@/components/ui'
import { updateProfile } from './actions'

interface Props {
  fullName: string
  phone: string
}

export function ProfileForm({ fullName, phone }: Props) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(fullName)
  const [phoneValue, setPhoneValue] = useState(phone)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    startTransition(async () => {
      const res = await updateProfile({ full_name: name, phone: phoneValue })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSaved(true)
    })
  }

  return (
    <form onSubmit={submit} className="grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Full name" required>
        <Input
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
          placeholder="Your name"
        />
      </Field>
      <Field label="Phone">
        <Input
          type="tel"
          value={phoneValue}
          onChange={(e) => {
            setPhoneValue(e.target.value)
            setSaved(false)
          }}
          placeholder="98765 43210"
        />
      </Field>

      {error && (
        <p className="rounded-control border border-red-200 bg-red-50 px-3 py-2 text-body-sm text-red-700 col-span-full">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="rounded-control border border-line bg-soft px-3 py-2 text-body-sm text-plum col-span-full">
          Profile updated.
        </p>
      )}

      <div className="col-span-full">
        <Button type="submit" disabled={pending} size="sm">
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-muted">
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </span>
      {children}
    </label>
  )
}
