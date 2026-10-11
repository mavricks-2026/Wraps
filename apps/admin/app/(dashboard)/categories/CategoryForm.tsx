'use client'
import { useRef, useState, useTransition } from 'react'
import { Button, Input } from '@goodsly/ui'
import { slugify } from '@goodsly/utils'
import { createCategory, updateCategory, uploadCategoryImage } from './actions'

export interface CategoryValue {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export interface ParentOption {
  id: string
  name: string
}

interface Props {
  // Existing category to edit; omit for create mode.
  category?: CategoryValue
  // Other categories selectable as a parent (the current one is excluded by the caller).
  parents: ParentOption[]
  // Render inline (create form lives at top of the page; edit form replaces a row).
  onDone?: () => void
}

export function CategoryForm({ category, parents, onDone }: Props) {
  const isEdit = Boolean(category)
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [description, setDescription] = useState(category?.description ?? '')
  const [parentId, setParentId] = useState(category?.parent_id ?? '')
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? '')
  const [sortOrder, setSortOrder] = useState<number | ''>(category?.sort_order ?? 0)
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // Auto-slugify from the name until the user manually edits the slug.
  function onNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function reset() {
    setName('')
    setSlug('')
    setSlugTouched(false)
    setDescription('')
    setParentId('')
    setImageUrl('')
    setSortOrder(0)
    setIsActive(true)
    setError(null)
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadCategoryImage(fd)
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''
    if (!res.ok) {
      setError(res.error)
      return
    }
    setImageUrl(res.data!.url)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const payload = {
        name,
        slug: slug || null,
        description: description || null,
        parent_id: parentId || null,
        image_url: imageUrl || null,
        sort_order: sortOrder === '' ? 0 : Number(sortOrder),
        is_active: isActive,
      }
      const res = isEdit
        ? await updateCategory({ id: category!.id, ...payload })
        : await createCategory(payload)
      if (!res.ok) {
        setError(res.error)
        return
      }
      if (!isEdit) reset()
      onDone?.()
    })
  }

  const busy = pending || uploading

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-stone-200 p-5 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <Field label="Name">
        <Input
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Necklaces"
        />
      </Field>

      <Field label="Slug">
        <Input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          placeholder="auto-from-name"
        />
      </Field>

      <Field label="Parent category">
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="h-10 w-full border border-stone-300 bg-white px-3 text-sm focus:border-stone-900 focus:outline-none"
        >
          <option value="">— None (top level) —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Sort order">
        <Input
          type="number"
          step="1"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </Field>

      <Field label="Description" className="md:col-span-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description for this category"
        />
      </Field>

      <Field label="Image (banner-images)" className="md:col-span-2">
        <div className="flex items-center gap-4">
          {imageUrl ? (
            <div className="h-16 w-16 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
          <label className="cursor-pointer">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="hidden"
              disabled={busy}
            />
            <span className="inline-flex items-center justify-center font-medium tracking-wide uppercase transition-colors disabled:opacity-50 bg-stone-900 text-white hover:bg-stone-700 h-8 px-3 text-xs cursor-pointer">
              {uploading ? 'Uploading…' : imageUrl ? 'Replace image' : 'Upload image'}
            </span>
          </label>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl('')}
              disabled={busy}
              className="text-xs uppercase tracking-wider text-red-700 hover:text-red-900"
            >
              Remove
            </button>
          )}
        </div>
      </Field>

      <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
        />
        Active
      </label>

      {error && (
        <p className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
          {error}
        </p>
      )}

      <div className="md:col-span-2 flex gap-2 justify-end">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create category'}
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
