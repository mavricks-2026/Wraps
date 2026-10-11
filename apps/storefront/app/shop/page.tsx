import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Shop' }
export default async function ShopPage() {
  const supabase = createClient()
  const { data: products } = await supabase.from('products').select('id, name, slug, base_price, compare_price, is_just_in, product_images(url, is_primary)').eq('is_active', true).order('created_at', { ascending: false }).limit(48)
  return (
    <div className="mx-auto max-w-7xl px-4 py-14">
      <h1 className="font-display text-h2 font-semibold text-ink">Shop</h1>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {(products ?? []).map((product) => (<ProductCard key={product.id} product={product} />))}
      </div>
    </div>
  )
}