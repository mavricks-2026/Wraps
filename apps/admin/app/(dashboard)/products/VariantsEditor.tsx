'use client'
import { useState, useTransition } from 'react'
import { Button, Input } from '@goodsly/ui'
import { formatINR } from '@goodsly/utils'
import { createVariant, deleteVariant, updateVariant, type VariantInput } from './actions'

interface ExistingVariant {
  id: string
  sku: string
  color: string | null
  size: string | null
  price: number
  compare_price: number | null
  weight_grams: number
  is_active: boolean
  qty_available: number
  qty_reserved: number
}

interface Props {
  productId: string
  variants: ExistingVariant[]
}

export function VariantsEditor({ productId, variants }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <section className="bg-white border border-stone-200">
      <header className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
        <h2 className="font-medium">Variants ({variants.length})</h2>
        {!adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            + Add variant
          </Button>
        )}
      </header>

      {adding && (
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50">
          <NewVariantRow productId={productId} onClose={() => setAdding(false)} />
        </div>
      )}

      {variants.length === 0 && !adding ? (
        <p className="px-6 py-8 text-sm text-stone-500 text-center">
          No variants yet. Click "Add variant" to create the first SKU (color, size, price, stock).
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
            <tr className="text-left">
              <th className="px-6 py-3 font-medium">SKU</th>
              <th className="px-6 py-3 font-medium">Color · Size</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Stock</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {variants.map((v) =>
              editingId === v.id ? (
                <EditVariantRow
                  key={v.id}
                  productId={productId}
                  variant={v}
                  onClose={() => setEditingId(null)}
                />
              ) : (
                <ReadVariantRow
                  key={v.id}
                  productId={productId}
                  variant={v}
                  onEdit={() => setEditingId(v.id)}
                />
              ),
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}

function ReadVariantRow({
  productId,
  variant,
  onEdit,
}: {
  productId: string
  variant: ExistingVariant
  onEdit: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const onSale =
    variant.compare_price !== null && variant.compare_price > variant.price
  const free = variant.qty_available - variant.qty_reserved

  function remove() {
    if (
      !confirm(
        `Delete variant ${variant.sku}? This cascades to its inventory row and product images.`,
      )
    )
      return
    setError(null)
    startTransition(async () => {
      const res = await deleteVariant(productId, variant.id)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <tr className="hover:bg-stone-50">
      <td className="px-6 py-3 font-mono text-xs">{variant.sku}</td>
      <td className="px-6 py-3 text-stone-700">
        {[variant.color, variant.size].filter(Boolean).join(' · ') || '—'}
      </td>
      <td className="px-6 py-3 tabular">
        {formatINR(variant.price)}
        {onSale && (
          <span className="ml-2 text-xs text-stone-400 line-through">
            {formatINR(variant.compare_price as number)}
          </span>
        )}
      </td>
      <td className="px-6 py-3 tabular">
        {variant.qty_available} avail · {variant.qty_reserved} reserved · {free} free
      </td>
      <td className="px-6 py-3 text-xs uppercase tracking-wider">
        {variant.is_active ? (
          <span className="text-emerald-700">Active</span>
        ) : (
          <span className="text-stone-400">Hidden</span>
        )}
      </td>
      <td className="px-6 py-3 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onEdit} disabled={pending}>
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
            Delete
          </Button>
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </td>
    </tr>
  )
}

function NewVariantRow({
  productId,
  onClose,
}: {
  productId: string
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sku, setSku] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [comparePrice, setComparePrice] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')
  const [initialQty, setInitialQty] = useState<number | ''>(0)
  const [reorderLevel, setReorderLevel] = useState<number | ''>(5)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (price === '') {
      setError('Price is required')
      return
    }
    const payload: VariantInput = {
      product_id: productId,
      sku,
      color: color || null,
      size: size || null,
      price: Number(price),
      compare_price: comparePrice === '' ? null : Number(comparePrice),
      weight_grams: weight === '' ? 0 : Number(weight),
      is_active: true,
      initial_qty: initialQty === '' ? 0 : Number(initialQty),
      reorder_level: reorderLevel === '' ? 5 : Number(reorderLevel),
    }
    startTransition(async () => {
      const res = await createVariant(payload)
      if (!res.ok) {
        setError(res.error)
        return
      }
      onClose()
    })
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      <Field label="SKU" required>
        <Input
          required
          value={sku}
          onChange={(e) => setSku(e.target.value.toUpperCase())}
          placeholder="AKI-TOTE-OLV-001"
        />
      </Field>
      <Field label="Color">
        <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Olive" />
      </Field>
      <Field label="Size">
        <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="M" />
      </Field>
      <Field label="Weight (g)">
        <Input
          type="number"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </Field>
      <Field label="Price (₹)" required>
        <Input
          type="number"
          min="0"
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </Field>
      <Field label="Compare ₹">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={comparePrice}
          onChange={(e) => setComparePrice(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </Field>
      <Field label="Initial stock">
        <Input
          type="number"
          min="0"
          value={initialQty}
          onChange={(e) => setInitialQty(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </Field>
      <Field label="Reorder ≤">
        <Input
          type="number"
          min="0"
          value={reorderLevel}
          onChange={(e) => setReorderLevel(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </Field>

      {error && (
        <p className="col-span-full bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <div className="col-span-full flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending} size="sm">
          Cancel
        </Button>
        <Button type="submit" disabled={pending} size="sm">
          {pending ? 'Saving…' : 'Add variant'}
        </Button>
      </div>
    </form>
  )
}

function EditVariantRow({
  productId,
  variant,
  onClose,
}: {
  productId: string
  variant: ExistingVariant
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sku, setSku] = useState(variant.sku)
  const [color, setColor] = useState(variant.color ?? '')
  const [size, setSize] = useState(variant.size ?? '')
  const [price, setPrice] = useState<number>(variant.price)
  const [comparePrice, setComparePrice] = useState<number | ''>(
    variant.compare_price ?? '',
  )
  const [weight, setWeight] = useState<number>(variant.weight_grams)
  const [active, setActive] = useState(variant.is_active)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload: VariantInput = {
      id: variant.id,
      product_id: productId,
      sku,
      color: color || null,
      size: size || null,
      price: Number(price),
      compare_price: comparePrice === '' ? null : Number(comparePrice),
      weight_grams: Number(weight),
      is_active: active,
    }
    startTransition(async () => {
      const res = await updateVariant(payload)
      if (!res.ok) {
        setError(res.error)
        return
      }
      onClose()
    })
  }

  return (
    <tr className="bg-stone-50">
      <td colSpan={6} className="px-6 py-4">
        <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Field label="SKU" required>
            <Input
              required
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Color">
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
          </Field>
          <Field label="Size">
            <Input value={size} onChange={(e) => setSize(e.target.value)} />
          </Field>
          <Field label="Weight (g)">
            <Input
              type="number"
              min="0"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </Field>
          <Field label="Price (₹)" required>
            <Input
              type="number"
              min="0"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </Field>
          <Field label="Compare ₹">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={comparePrice}
              onChange={(e) =>
                setComparePrice(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
          </Field>
          <label className="flex items-center gap-2 col-span-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="accent-stone-900 w-4 h-4"
            />
            Active (visible to customers)
          </label>

          {error && (
            <p className="col-span-full bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">
              {error}
            </p>
          )}

          <p className="col-span-full text-xs text-stone-500">
            Note: stock is edited from the Inventory page, not here.
          </p>

          <div className="col-span-full flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} size="sm" disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? 'Saving…' : 'Save variant'}
            </Button>
          </div>
        </form>
      </td>
    </tr>
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
      <span className="block text-[10px] uppercase tracking-wider text-stone-500 mb-1">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
