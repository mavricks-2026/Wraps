import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { ProductForm } from '../ProductForm'
import { VariantsEditor } from '../VariantsEditor'
import { ImagesEditor } from '../ImagesEditor'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default async function ProductEditPage({ params }: PageProps) {
  const supabase = getAdminClient()

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(
        `id, name, slug, description, material, care_instructions, category_id,
         base_price, compare_price, tags,
         is_active, is_featured, is_just_in, is_gift_packable,
         product_variants(
           id, sku, color, size, price, compare_price, weight_grams, is_active,
           inventory(qty_available, qty_reserved)
         ),
         product_images(id, url, storage_path, alt_text, is_primary, sort_order)`,
      )
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
  ])

  if (!product) notFound()

  // Flatten variants + their inventory rows for the editor
  const variants = (
    product.product_variants as Array<{
      id: string
      sku: string
      color: string | null
      size: string | null
      price: number
      compare_price: number | null
      weight_grams: number
      is_active: boolean
      inventory:
        | { qty_available: number; qty_reserved: number }
        | { qty_available: number; qty_reserved: number }[]
        | null
    }>
  ).map((v) => {
    const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory
    return {
      id: v.id,
      sku: v.sku,
      color: v.color,
      size: v.size,
      price: Number(v.price),
      compare_price: v.compare_price === null ? null : Number(v.compare_price),
      weight_grams: v.weight_grams,
      is_active: v.is_active,
      qty_available: inv?.qty_available ?? 0,
      qty_reserved: inv?.qty_reserved ?? 0,
    }
  })

  const images = (product.product_images as Array<{
    id: string
    url: string
    storage_path: string
    alt_text: string | null
    is_primary: boolean
    sort_order: number
  }>) ?? []

  return (
    <>
      <PageHeader
        title={product.name as string}
        description={`/products/${product.slug as string}`}
        action={
          <Link
            href="/products"
            className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900"
          >
            ← All products
          </Link>
        }
      />

      <div className="px-8 py-6 space-y-6 max-w-5xl">
        <ProductForm
          mode="edit"
          initial={{
            id: product.id as string,
            name: product.name as string,
            slug: product.slug as string,
            description: (product.description as string | null) ?? null,
            material: (product.material as string | null) ?? null,
            care_instructions: (product.care_instructions as string | null) ?? null,
            category_id: (product.category_id as string | null) ?? null,
            base_price: Number(product.base_price),
            compare_price:
              product.compare_price === null ? null : Number(product.compare_price),
            tags: (product.tags as string[]) ?? [],
            is_active: product.is_active as boolean,
            is_featured: product.is_featured as boolean,
            is_just_in: product.is_just_in as boolean,
            is_gift_packable: product.is_gift_packable as boolean,
          }}
          categories={(categories ?? []).map((c) => ({
            id: c.id as string,
            name: c.name as string,
          }))}
        />

        <VariantsEditor productId={product.id as string} variants={variants} />

        <ImagesEditor productId={product.id as string} images={images} />
      </div>
    </>
  )
}
