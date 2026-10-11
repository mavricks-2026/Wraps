'use client'
import { useRef, useState } from 'react'
import { Input } from '@goodsly/ui'
import { uploadBannerImage } from './actions'

export interface PromotionFieldsState {
  title: string
  badge_text: string
  link_url: string
  banner_image_url: string
  mobile_image_url: string
  sort_order: number | ''
  starts_at: string
  ends_at: string
  is_active: boolean
}

export function emptyPromotionFields(): PromotionFieldsState {
  return {
    title: '',
    badge_text: '',
    link_url: '',
    banner_image_url: '',
    mobile_image_url: '',
    sort_order: 0,
    starts_at: '',
    ends_at: '',
    is_active: true,
  }
}

// Convert a stored ISO timestamp to the value a datetime-local input expects
// (YYYY-MM-DDTHH:mm, local time).
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

interface Props {
  state: PromotionFieldsState
  setState: (next: PromotionFieldsState) => void
  disabled?: boolean
}

export function PromotionFields({ state, setState, disabled }: Props) {
  function patch(p: Partial<PromotionFieldsState>) {
    setState({ ...state, ...p })
  }

  return (
    <>
      <Field label="Title">
        <Input
          required
          value={state.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Summer Sale"
          disabled={disabled}
        />
      </Field>

      <Field label="Badge text (optional)">
        <Input
          value={state.badge_text}
          onChange={(e) => patch({ badge_text: e.target.value })}
          placeholder="50% OFF"
          disabled={disabled}
        />
      </Field>

      <Field label="Link URL (optional)">
        <Input
          value={state.link_url}
          onChange={(e) => patch({ link_url: e.target.value })}
          placeholder="/collections/summer"
          disabled={disabled}
        />
      </Field>

      <Field label="Sort order">
        <Input
          type="number"
          step="1"
          value={state.sort_order}
          onChange={(e) =>
            patch({ sort_order: e.target.value === '' ? '' : Number(e.target.value) })
          }
          disabled={disabled}
        />
      </Field>

      <Field label="Starts at (optional)">
        <Input
          type="datetime-local"
          value={state.starts_at}
          onChange={(e) => patch({ starts_at: e.target.value })}
          disabled={disabled}
        />
      </Field>

      <Field label="Ends at (optional)">
        <Input
          type="datetime-local"
          value={state.ends_at}
          onChange={(e) => patch({ ends_at: e.target.value })}
          disabled={disabled}
        />
      </Field>

      <ImageUpload
        label="Banner image (desktop)"
        slot="banner"
        url={state.banner_image_url}
        onChange={(url) => patch({ banner_image_url: url })}
        disabled={disabled}
      />

      <ImageUpload
        label="Mobile image"
        slot="mobile"
        url={state.mobile_image_url}
        onChange={(url) => patch({ mobile_image_url: url })}
        disabled={disabled}
      />

      <label className="md:col-span-2 flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={state.is_active}
          onChange={(e) => patch({ is_active: e.target.checked })}
          disabled={disabled}
        />
        Active
      </label>
    </>
  )
}

function ImageUpload({
  label,
  slot,
  url,
  onChange,
  disabled,
}: {
  label: string
  slot: 'banner' | 'mobile'
  url: string
  onChange: (url: string) => void
  disabled?: boolean
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('slot', slot)
    const res = await uploadBannerImage(fd)
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ''
    if (!res.ok) {
      setError(res.error)
      return
    }
    onChange(res.data!.url)
  }

  return (
    <Field label={label}>
      <div className="space-y-2">
        {url ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className="h-14 w-24 object-cover border border-stone-200 bg-stone-100"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled || uploading}
              className="text-xs uppercase tracking-wider text-red-700 hover:text-red-900"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="h-14 w-24 border border-stone-200 bg-stone-100" />
        )}
        <label className="inline-block cursor-pointer">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            className="hidden"
            disabled={disabled || uploading}
          />
          <span className="inline-flex items-center justify-center font-medium tracking-wide uppercase transition-colors disabled:opacity-50 bg-stone-900 text-white hover:bg-stone-700 h-8 px-3 text-xs cursor-pointer">
            {uploading ? 'Uploading…' : url ? 'Replace image' : 'Upload image'}
          </span>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Field>
  )
}

export function Field({
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
