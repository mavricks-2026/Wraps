'use client'
import { useMemo, useState, useTransition } from 'react'
import { Button, Input } from '@goodsly/ui'
import {
  addPromoProduct,
  deletePromotion,
  removePromoProduct,
  togglePromotion,
  updatePromotion,
} from './actions'
import {
  PromotionFields,
  toLocalInput,
  type PromotionFieldsState,
} from './PromotionFields'

interface ProductOption {
  id: string
  name: string
}

interface FeaturedItem {
  id: string // promo_products.id
  productId: string
  name: string
}

interface Promotion {
  id: string
  title: string
  banner_image_url: string | null
  mobile_image_url: string | null
  badge_text: string | null
  link_url: string | null
  sort_order: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
}

interface Props {
  promotion: Promotion
  featured: FeaturedItem[]
  products: ProductOption[]
}

export function PromotionRowActions({ promotion, featured, products }: Props) {
  const [editing, setEditing] = useState(false)
  const [managing, setManaging] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function toggle() {
    setError(null)
    startTransition(async () => {
      const res = await togglePromotion(promotion.id, !promotion.is_active)
      if (!res.ok) setError(res.error)
    })
  }

  function remove() {
    if (!confirm(`Delete "${promotion.title}"? Featured-product links are removed too.`)) return
    setError(null)
    startTransition(async () => {
      const res = await deletePromotion(promotion.id)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)} disabled={pending}>
          {editing ? 'Close' : 'Edit'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setManaging((v) => !v)} disabled={pending}>
          Featured ({featured.length})
        </Button>
        <Button size="sm" variant="outline" onClick={toggle} disabled={pending}>
          {promotion.is_active ? 'Deactivate' : 'Activate'}
        </Button>
        <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
          Delete
        </Button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}

      {editing && (
        <EditPromotion
          promotion={promotion}
          onDone={() => setEditing(false)}
        />
      )}

      {managing && (
        <FeaturedManager
          promotionId={promotion.id}
          featured={featured}
          products={products}
        />
      )}
    </div>
  )
}

function EditPromotion({
  promotion,
  onDone,
}: {
  promotion: Promotion
  onDone: () => void
}) {
  const [state, setState] = useState<PromotionFieldsState>({
    title: promotion.title,
    badge_text: promotion.badge_text ?? '',
    link_url: promotion.link_url ?? '',
    banner_image_url: promotion.banner_image_url ?? '',
    mobile_image_url: promotion.mobile_image_url ?? '',
    sort_order: promotion.sort_order ?? 0,
    starts_at: toLocalInput(promotion.starts_at),
    ends_at: toLocalInput(promotion.ends_at),
    is_active: promotion.is_active,
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await updatePromotion({
        id: promotion.id,
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
        onDone()
      }
    })
  }

  return (
    <form
      onSubmit={submit}
      className="mt-2 w-[42rem] max-w-[80vw] text-left bg-stone-50 border border-stone-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <PromotionFields state={state} setState={setState} disabled={pending} />

      {error && (
        <p className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <div className="md:col-span-2 flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function FeaturedManager({
  promotionId,
  featured,
  products,
}: {
  promotionId: string
  featured: FeaturedItem[]
  products: ProductOption[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const featuredIds = useMemo(() => new Set(featured.map((f) => f.productId)), [featured])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => !featuredIds.has(p.id))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice(0, 8)
  }, [products, featuredIds, query])

  function add(productId: string) {
    setError(null)
    startTransition(async () => {
      const res = await addPromoProduct(promotionId, productId)
      if (!res.ok) setError(res.error)
      else setQuery('')
    })
  }

  function remove(promoProductId: string) {
    setError(null)
    startTransition(async () => {
      const res = await removePromoProduct(promoProductId)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <div className="mt-2 w-[36rem] max-w-[80vw] text-left bg-stone-50 border border-stone-200 p-5 space-y-4">
      <div>
        <span className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
          Featured products ({featured.length})
        </span>
        {featured.length === 0 ? (
          <p className="text-sm text-stone-500">No featured products yet.</p>
        ) : (
          <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
            {featured.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{f.name}</span>
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  disabled={pending}
                  className="text-xs uppercase tracking-wider text-red-700 hover:text-red-900 disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <span className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
          Add a product
        </span>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          disabled={pending}
        />
        <ul className="mt-2 divide-y divide-stone-200 border border-stone-200 bg-white">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-stone-500">
              {query ? 'No matching products.' : 'All products are already featured.'}
            </li>
          ) : (
            matches.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{p.name}</span>
                <button
                  type="button"
                  onClick={() => add(p.id)}
                  disabled={pending}
                  className="text-xs uppercase tracking-wider text-stone-700 hover:text-stone-900 disabled:opacity-50"
                >
                  Add
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
