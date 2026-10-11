'use client'
import { useRef, useState, useTransition } from 'react'
import { Button } from '@goodsly/ui'
import {
  deleteProductImage,
  setPrimaryImage,
  uploadProductImage,
} from './actions'

interface Image {
  id: string
  url: string
  storage_path: string
  alt_text: string | null
  is_primary: boolean
  sort_order: number
}

interface Props {
  productId: string
  images: Image[]
}

export function ImagesEditor({ productId, images }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setError(null)

    // Upload sequentially so primary-image logic stays predictable.
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('product_id', productId)
      fd.append('file', file)
      fd.append('alt_text', file.name.replace(/\.[^.]+$/, ''))
      // eslint-disable-next-line no-await-in-loop
      const res = await uploadProductImage(fd)
      if (!res.ok) {
        setError(res.error)
        break
      }
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  function makePrimary(imageId: string) {
    setError(null)
    startTransition(async () => {
      const res = await setPrimaryImage(productId, imageId)
      if (!res.ok) setError(res.error)
    })
  }

  function remove(image: Image) {
    if (!confirm(`Delete this image? File at ${image.storage_path} will be removed permanently.`))
      return
    setError(null)
    startTransition(async () => {
      const res = await deleteProductImage(productId, image.id, image.storage_path)
      if (!res.ok) setError(res.error)
    })
  }

  const sorted = [...images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    return a.sort_order - b.sort_order
  })

  return (
    <section className="bg-white border border-stone-200">
      <header className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
        <h2 className="font-medium">Images ({images.length})</h2>
        <label className="cursor-pointer">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            className="hidden"
            disabled={pending}
          />
          <span className="inline-flex items-center justify-center font-medium tracking-wide uppercase transition-colors disabled:opacity-50 bg-stone-900 text-white hover:bg-stone-700 h-8 px-3 text-xs cursor-pointer">
            Upload images
          </span>
        </label>
      </header>

      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-800 px-6 py-2 text-sm">
          {error}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="px-6 py-8 text-sm text-stone-500 text-center">
          No images yet. Upload JPEG/PNG/WebP up to 5 MB. The first one auto-becomes the primary
          (the one that shows on the product card).
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          {sorted.map((img) => (
            <div key={img.id} className="relative group">
              <div className="aspect-square bg-stone-100 overflow-hidden border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text ?? ''}
                  className="w-full h-full object-cover"
                />
              </div>
              {img.is_primary && (
                <span className="absolute top-2 left-2 bg-stone-900 text-white text-[10px] uppercase tracking-wider px-2 py-0.5">
                  Primary
                </span>
              )}
              <div className="mt-2 flex justify-between gap-2">
                {!img.is_primary && (
                  <button
                    onClick={() => makePrimary(img.id)}
                    disabled={pending}
                    className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900"
                  >
                    Make primary
                  </button>
                )}
                <button
                  onClick={() => remove(img)}
                  disabled={pending}
                  className="text-xs uppercase tracking-wider text-red-700 hover:text-red-900 ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
