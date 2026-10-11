'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@goodsly/ui'
import { slugify } from '@goodsly/utils'
import { createProduct, updateProduct, deleteProduct, type ProductInput } from './actions'

interface CategoryOption {
  id: string
  name: string
}

interface Props {
  mode: 'new' | 'edit'
  initial?: Partial<ProductInput>
  categories: CategoryOption[]
}

export function ProductForm({ mode, initial = {}, categories }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initial.name ?? '')
  const [slug, setSlug] = useState(initial.slug ?? '')
  const [description, setDescription] = useState(initial.description ?? '')
  const [material, setMaterial] = useState(initial.material ?? '')
  const [careInstructions, setCareInstructions] = useState(initial.care_instructions ?? '')
  const [categoryId, setCategoryId] = useState(initial.category_id ?? '')
  const [basePrice, setBasePrice] = useState<number | ''>(initial.base_price ?? '')
  const [comparePrice, setComparePrice] = useState<number | ''>(
    initial.compare_price == null ? '' : (initial.compare_price as number),
  )
  const [tagsCsv, setTagsCsv] = useState((initial.tags ?? []).join(', '))
  const [isActive, setIsActive] = useState(initial.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(initial.is_featured ?? false)
  const [isJustIn, setIsJustIn] = useState(initial.is_just_in ?? false)
  const [isGiftPackable, setIsGiftPackable] = useState(initial.is_gift_packable ?? true)

  // Auto-fill slug from name if slug is empty (until user edits it manually)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))

  function onNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (basePrice === '') {
      setError('Base price is required')
      return
    }
    const payload: ProductInput = {
      id: initial.id,
      name,
      slug,
      description: description || null,
      material: material || null,
      care_instructions: careInstructions || null,
      category_id: categoryId || null,
      base_price: Number(basePrice),
      compare_price: comparePrice === '' ? null : Number(comparePrice),
      tags: tagsCsv
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      is_active: isActive,
      is_featured: isFeatured,
      is_just_in: isJustIn,
      is_gift_packable: isGiftPackable,
    }

    startTransition(async () => {
      const res = mode === 'new' ? await createProduct(payload) : await updateProduct(payload)
      if (res && !res.ok) setError(res.error)
      // createProduct redirects on success; updateProduct returns ok and we refresh
      else if (mode === 'edit') router.refresh()
    })
  }

  function handleDelete() {
    if (!initial.id) return
    if (!confirm(`Delete "${name}"? This will cascade to variants, images, and inventory.`)) return
    startTransition(async () => {
      const res = await deleteProduct(initial.id!)
      if (res && !res.ok) setError(res.error)
      // success redirects to /products
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name" required className="md:col-span-2">
          <Input
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Crinkle Outline Tote Bag"
          />
        </Field>

        <Field label="Slug" required>
          <Input
            required
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value))
              setSlugTouched(true)
            }}
            placeholder="crinkle-outline-tote-bag"
          />
        </Field>

        <Field label="Category">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 w-full border border-stone-300 bg-white px-3 text-sm focus:border-stone-900 focus:outline-none"
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description" className="md:col-span-2">
          <textarea
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
          />
        </Field>

        <Field label="Material">
          <Input
            value={material ?? ''}
            onChange={(e) => setMaterial(e.target.value)}
            placeholder="Recycled Polyester"
          />
        </Field>

        <Field label="Care instructions">
          <Input
            value={careInstructions ?? ''}
            onChange={(e) => setCareInstructions(e.target.value)}
            placeholder="Spot clean only. Air dry."
          />
        </Field>

        <Field label="Base price (₹)" required>
          <Input
            type="number"
            min="0"
            step="0.01"
            required
            value={basePrice}
            onChange={(e) =>
              setBasePrice(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
        </Field>

        <Field label="Compare price (₹) — for sale strikethrough">
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

        <Field label="Tags (comma-separated)" className="md:col-span-2">
          <Input
            value={tagsCsv}
            onChange={(e) => setTagsCsv(e.target.value)}
            placeholder="bags, cotton, summer"
          />
        </Field>
      </div>

      <fieldset className="space-y-2 border-t border-stone-200 pt-4">
        <legend className="text-xs uppercase tracking-wider text-stone-500">Flags</legend>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Toggle label="Active" checked={isActive} onChange={setIsActive} />
          <Toggle label="Featured" checked={isFeatured} onChange={setIsFeatured} />
          <Toggle label="Just In" checked={isJustIn} onChange={setIsJustIn} />
          <Toggle label="Gift packable" checked={isGiftPackable} onChange={setIsGiftPackable} />
        </div>
      </fieldset>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 text-sm">{error}</p>
      )}

      <div className="flex justify-between items-center">
        {mode === 'edit' ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            className="text-red-700"
          >
            Delete product
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'Saving…' : mode === 'new' ? 'Create product' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="block text-xs uppercase tracking-wider text-stone-500 mb-2">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-stone-900 w-4 h-4"
      />
      {label}
    </label>
  )
}
