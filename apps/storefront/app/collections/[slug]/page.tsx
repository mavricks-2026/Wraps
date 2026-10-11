import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import { cn } from '@goodsly/utils'

export const revalidate = 0

interface PageProps {
  params: { slug: string }
  searchParams: { color?: string }
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createClient()
  const { data } = await supabase
    .from('categories')
    .select('name')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle()
  return { title: data?.name ?? 'Collection' }
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const supabase = createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, description')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!category) notFound()

  // Color filter via inner-join on variants
  let productsQuery = supabase
    .from('products')
    .select(
      `id, name, slug, base_price, compare_price, is_just_in,
       product_images(url, is_primary),
       product_variants!inner(color)`,
    )
    .eq('category_id', category.id)
    .eq('is_active', true)

  if (searchParams.color) {
    productsQuery = productsQuery.eq('product_variants.color', searchParams.color)
  }

  const { data: products } = await productsQuery

  // Distinct colors for the filter pills
  const { data: variantsForColors } = await supabase
    .from('product_variants')
    .select('color, products!inner(category_id, is_active)')
    .eq('products.category_id', category.id)
    .eq('products.is_active', true)
    .eq('is_active', true)

  const colors = Array.from(
    new Set((variantsForColors ?? []).map((v) => v.color).filter((c): c is string => Boolean(c))),
  ).sort()

  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <header className="mb-10">
        <h1 className="font-display text-h1 font-semibold text-ink">{category.name}</h1>
        {category.description && (
          <p className="mt-3 max-w-2xl text-body-lg text-muted">{category.description}</p>
        )}
      </header>

      {colors.length > 0 && (
        <div className="mb-10 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs uppercase tracking-wider text-muted">Colour:</span>
          <FilterPill href={`/collections/${params.slug}`} active={!searchParams.color}>
            All
          </FilterPill>
          {colors.map((color) => (
            <FilterPill
              key={color}
              href={`/collections/${params.slug}?color=${encodeURIComponent(color)}`}
              active={searchParams.color === color}
            >
              {color}
            </FilterPill>
          ))}
        </div>
      )}

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-body text-muted">
            {searchParams.color
              ? `No products in this colour. `
              : 'No products in this collection yet. '}
            {searchParams.color && (
              <Link
                href={`/collections/${params.slug}`}
                className="font-semibold text-plum underline hover:text-plum-ink"
              >
                Clear filter
              </Link>
            )}
          </p>
        </div>
      )}
    </div>
  )
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors',
        active
          ? 'border-pink bg-pink text-white shadow-sm'
          : 'border-line bg-surface text-plum hover:border-pink hover:bg-tint',
      )}
    >
      {children}
    </Link>
  )
}
