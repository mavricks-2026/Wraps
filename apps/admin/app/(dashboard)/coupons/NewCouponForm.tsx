'use client'
import { useState, useTransition } from 'react'
import { Button, Input } from '@goodsly/ui'
import { createCoupon } from './actions'

interface ProductOption {
  id: string
  name: string
}

export function NewCouponForm({ products }: { products: ProductOption[] }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'flat' | 'free_product'>('percent')
  const [value, setValue] = useState<number | ''>('')
  const [freeProductId, setFreeProductId] = useState('')
  const [minOrder, setMinOrder] = useState<number | ''>(0)
  const [maxUses, setMaxUses] = useState<number | ''>('')
  const [expiresAt, setExpiresAt] = useState('')
  const [description, setDescription] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setCode('')
    setValue('')
    setFreeProductId('')
    setMinOrder(0)
    setMaxUses('')
    setExpiresAt('')
    setDescription('')
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createCoupon({
        code,
        description: description || undefined,
        type,
        value: value === '' ? null : Number(value),
        free_product_id: freeProductId || null,
        min_order_value: minOrder === '' ? 0 : Number(minOrder),
        max_uses: maxUses === '' ? null : Number(maxUses),
        expires_at: expiresAt || null,
        is_active: true,
      })
      if (!res.ok) {
        setError(res.error)
      } else {
        reset()
        setOpen(false)
      }
    })
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ New coupon</Button>
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-stone-200 p-5 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <Field label="Code">
        <Input
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="WELCOME10"
        />
      </Field>

      <Field label="Type">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="h-10 w-full border border-stone-300 bg-white px-3 text-sm focus:border-stone-900 focus:outline-none"
        >
          <option value="percent">Percent off</option>
          <option value="flat">Flat ₹ off</option>
          <option value="free_product">Free product</option>
        </select>
      </Field>

      {type !== 'free_product' && (
        <Field label={type === 'percent' ? 'Percent (0-100)' : 'Amount (₹)'}>
          <Input
            type="number"
            min="0"
            step={type === 'percent' ? '1' : '0.01'}
            value={value}
            onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
        </Field>
      )}

      {type === 'free_product' && (
        <Field label="Free product">
          <select
            required
            value={freeProductId}
            onChange={(e) => setFreeProductId(e.target.value)}
            className="h-10 w-full border border-stone-300 bg-white px-3 text-sm focus:border-stone-900 focus:outline-none"
          >
            <option value="">Choose…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Min order value (₹)">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </Field>

      <Field label="Max uses (blank = unlimited)">
        <Input
          type="number"
          min="1"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </Field>

      <Field label="Expires at (optional)">
        <Input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </Field>

      <Field label="Description" className="md:col-span-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this coupon do?"
        />
      </Field>

      {error && (
        <p className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <div className="md:col-span-2 flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false)
            reset()
          }}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Create coupon'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="block text-xs uppercase tracking-wider text-stone-500 mb-2">{label}</span>
      {children}
    </label>
  )
}
