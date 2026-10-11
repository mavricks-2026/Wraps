import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
export const revalidate = 0
export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: category } = await supabase.from('categories').select('id, name, description').eq('slug', params.slug).eq('is_active', true).maybeSingle()
  if (!category) notFound()
  const { data: products } = await supabase.from('products').select('id, name, slug, base_price, compare_price, is_just_in, product_images(url, is_primary)').eq('category_id', category.id).eq('is_active', true)
  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <h1 className="font-display text-h1 font-semibold text-ink">{category.name}</h1>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {(products ?? []).map((product) => (<ProductCard key={product.id} product={product} />))}
      </div>
    </div>
  )
}