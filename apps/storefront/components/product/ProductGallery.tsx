'use client'
import { useState } from 'react'
import { cn } from '@goodsly/utils'

interface Image {
  id: string
  url: string
  alt_text: string | null
}

export function ProductGallery({ images, productName }: { images: Image[]; productName: string }) {
  const [active, setActive] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-card bg-tint font-display text-6xl text-pink/50 arch-mask">
        {productName[0]}
      </div>
    )
  }

  const main = images[active] ?? images[0]
  if (!main) return null

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-card bg-tint arch-mask">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main.url}
          alt={main.alt_text ?? productName}
          className="h-full w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={cn(
                'h-20 w-20 flex-shrink-0 overflow-hidden rounded-control border-2 bg-tint transition-colors',
                i === active ? 'border-pink' : 'border-transparent hover:border-line',
              )}
              aria-label={`View image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt_text ?? `${productName} thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
