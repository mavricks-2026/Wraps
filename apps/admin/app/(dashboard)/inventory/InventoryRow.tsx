'use client'
import { useState, useTransition } from 'react'
import { Button, Input } from '@goodsly/ui'
import { adjustInventory } from './actions'

interface Props {
  variantId: string
  productName: string
  sku: string
  variantLabel: string
  qtyAvailable: number
  qtyReserved: number
  qtySold: number
  reorderLevel: number
}

export function InventoryRow(props: Props) {
  const [available, setAvailable] = useState(props.qtyAvailable)
  const [reorder, setReorder] = useState(props.reorderLevel)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const dirty = available !== props.qtyAvailable || reorder !== props.reorderLevel
  const lowStock = available - props.qtyReserved <= reorder
  const outOfStock = available - props.qtyReserved <= 0

  function save() {
    setError(null)
    startTransition(async () => {
      const res = await adjustInventory(props.variantId, available, reorder)
      if (!res.ok) setError(res.error)
      else setSavedAt(Date.now())
    })
  }

  return (
    <tr className="hover:bg-stone-50">
      <td className="px-5 py-3">
        <div className="font-medium">{props.productName}</div>
        <div className="text-xs text-stone-500">
          {props.sku} {props.variantLabel && `· ${props.variantLabel}`}
        </div>
      </td>
      <td className="px-5 py-3">
        <Input
          type="number"
          min="0"
          value={available}
          onChange={(e) => setAvailable(Number(e.target.value))}
          className="w-20 text-sm"
        />
      </td>
      <td className="px-5 py-3 tabular text-stone-600">{props.qtyReserved}</td>
      <td className="px-5 py-3 tabular text-stone-600">{props.qtySold}</td>
      <td className="px-5 py-3">
        <Input
          type="number"
          min="0"
          value={reorder}
          onChange={(e) => setReorder(Number(e.target.value))}
          className="w-20 text-sm"
        />
      </td>
      <td className="px-5 py-3 text-xs">
        {outOfStock ? (
          <span className="text-red-700 uppercase tracking-wider">Out of stock</span>
        ) : lowStock ? (
          <span className="text-amber-700 uppercase tracking-wider">Low</span>
        ) : (
          <span className="text-emerald-700 uppercase tracking-wider">In stock</span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-col items-end gap-1">
          <Button size="sm" onClick={save} disabled={!dirty || pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
          {error && <span className="text-xs text-red-600">{error}</span>}
          {savedAt && !dirty && <span className="text-xs text-emerald-700">Saved</span>}
        </div>
      </td>
    </tr>
  )
}
