import Link from 'next/link'
import { formatINR } from '@goodsly/utils'
import { Badge } from '@/components/ui'

export interface ProductCardData {
  id: string
  name: string
  slug: string
  base_price: number
  compare_price: number | null
  is_just_in?: boolean
  product_images: { url: string; is_primary: boolean }[] | null
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const primary =
    product.product_images?.find((i) => i.is_primary) ?? product.product_images?.[0] ?? null
  const onSale =
    product.compare_price !== null && product.compare_price > product.base_price

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-card bg-surface p-3 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative mb-3 aspect-[3/4] overflow-hidden bg-tint arch-mask">
        {primary ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primary.url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-pink/50 font-display text-3xl">
            W
          </div>
        )}
        <div className="absolute left-4 top-4 flex gap-1.5">
          {product.is_just_in && <Badge tone="new">Just In</Badge>}
          {onSale && <Badge tone="sale">Sale</Badge>}
        </div>
      </div>
      <h3 className="font-display text-[15px] font-semibold text-ink transition-colors group-hover:text-plum">
        {product.name}
      </h3>
      <div className="mt-1 flex gap-2 text-sm">
        <span className={onSale ? 'font-semibold text-pink' : 'font-semibold text-plum'}>
          {formatINR(product.base_price)}
        </span>
        {onSale && (
          <span className="text-muted line-through">{formatINR(product.compare_price!)}</span>
        )}
      </div>
    </Link>
  )
}
