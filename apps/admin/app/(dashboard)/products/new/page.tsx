import Link from 'next/link'
import { getAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/PageHeader'
import { ProductForm } from '../ProductForm'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const supabase = getAdminClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <>
      <PageHeader
        title="New product"
        description="Create the product first, then add variants and images on the next screen."
        action={
          <Link
            href="/products"
            className="text-xs uppercase tracking-wider text-stone-600 hover:text-stone-900"
          >
            ← All products
          </Link>
        }
      />
      <div className="px-8 py-6">
        <ProductForm
          mode="new"
          categories={(categories ?? []).map((c) => ({
            id: c.id as string,
            name: c.name as string,
          }))}
        />
      </div>
    </>
  )
}
