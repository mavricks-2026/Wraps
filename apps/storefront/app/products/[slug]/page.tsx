import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductDetail } from '@/components/product/ProductDetail'

export const revalidate = 0

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle()
  return {
    title: data?.name ?? 'Product',
    description: data?.description ?? undefined,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: product } = await supabase
    .from('products')
    .select(
      `id, name, slug, description, material, care_instructions,
       base_price, compare_price, is_gift_packable,
       product_images(id, url, alt_text, is_primary, sort_order),
       product_variants(
         id, sku, color, size, price, compare_price, is_active,
         inventory(qty_available, qty_reserved)
       )`,
    )
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!product) notFound()

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <nav aria-label="Breadcrumb">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-plum"
          >
            <span className="msym text-base" aria-hidden>
              arrow_back
            </span>
            Back to home
          </Link>
        </nav>
      </div>
      <ProductDetail product={product} />
    </div>
  )
}
