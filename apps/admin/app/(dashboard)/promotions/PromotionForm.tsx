'use client'
import { useState, useTransition } from 'react'
import { Button } from '@goodsly/ui'
import { createPromotion } from './actions'
import {
  PromotionFields,
  emptyPromotionFields,
  type PromotionFieldsState,
} from './PromotionFields'

interface ProductOption {
  id: string
  name: string
}

export function PromotionForm({ products: _products }: { products: ProductOption[] }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<PromotionFieldsState>(emptyPromotionFields())
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setState(emptyPromotionFields())
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await createPromotion({
        title: state.title,
        badge_text: state.badge_text || null,
        link_url: state.link_url || null,
        banner_image_url: state.banner_image_url || null,
        mobile_image_url: state.mobile_image_url || null,
        sort_order: state.sort_order === '' ? 0 : Number(state.sort_order),
        starts_at: state.starts_at || null,
        ends_at: state.ends_at || null,
        is_active: state.is_active,
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
    return <Button onClick={() => setOpen(true)}>+ New promotion</Button>
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-stone-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <PromotionFields state={state} setState={setState} disabled={pending} />

      <p className="md:col-span-2 text-xs text-stone-500">
        Add featured products after creating, from the promotion&apos;s row actions.
      </p>

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
          {pending ? 'Saving…' : 'Create promotion'}
        </Button>
      </div>
    </form>
  )
}
