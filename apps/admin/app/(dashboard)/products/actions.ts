'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@goodsly/utils'

export interface ProductInput {
  id?: string
  name: string
  slug: string
  description?: string | null
  material?: string | null
  care_instructions?: string | null
  category_id?: string | null
  base_price: number
  compare_price?: number | null
  tags?: string[]
  is_active?: boolean
  is_featured?: boolean
  is_just_in?: boolean
  is_gift_packable?: boolean
}

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function validate(input: ProductInput): string | null {
  if (!input.name?.trim()) return 'Name is required'
  if (!input.slug?.trim()) return 'Slug is required'
  if (!Number.isFinite(input.base_price) || input.base_price < 0)
    return 'Base price must be a non-negative number'
  if (input.compare_price != null && (input.compare_price as number) < 0)
    return 'Compare price must be non-negative'
  return null
}

export async function createProduct(input: ProductInput): Promise<Result<{ id: string }>> {
  await requireAdmin()
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const admin = getAdminClient()
  const slug = slugify(input.slug || input.name)
  const { data, error } = await admin
    .from('products')
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description ?? null,
      material: input.material ?? null,
      care_instructions: input.care_instructions ?? null,
      category_id: input.category_id || null,
      base_price: input.base_price,
      compare_price: input.compare_price ?? null,
      tags: input.tags ?? [],
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
      is_just_in: input.is_just_in ?? false,
      is_gift_packable: input.is_gift_packable ?? true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/products')
  redirect(`/products/${(data as { id: string }).id}`)
}

export async function updateProduct(input: ProductInput): Promise<Result> {
  await requireAdmin()
  if (!input.id) return { ok: false, error: 'Missing product id' }
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const admin = getAdminClient()
  const { error } = await admin
    .from('products')
    .update({
      name: input.name.trim(),
      slug: slugify(input.slug || input.name),
      description: input.description ?? null,
      material: input.material ?? null,
      care_instructions: input.care_instructions ?? null,
      category_id: input.category_id || null,
      base_price: input.base_price,
      compare_price: input.compare_price ?? null,
      tags: input.tags ?? [],
      is_active: input.is_active ?? true,
      is_featured: input.is_featured ?? false,
      is_just_in: input.is_just_in ?? false,
      is_gift_packable: input.is_gift_packable ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/products')
  revalidatePath(`/products/${input.id}`)
  return { ok: true }
}

export async function deleteProduct(productId: string): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()
  const { error } = await admin.from('products').delete().eq('id', productId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/products')
  redirect('/products')
}

// ─────────────────────────────────────────────
// Variants
// ─────────────────────────────────────────────

export interface VariantInput {
  id?: string
  product_id: string
  sku: string
  color?: string | null
  size?: string | null
  price: number
  compare_price?: number | null
  weight_grams?: number
  is_active?: boolean
  initial_qty?: number
  reorder_level?: number
}

function validateVariant(input: VariantInput): string | null {
  if (!input.sku?.trim()) return 'SKU is required'
  if (!Number.isFinite(input.price) || input.price < 0) return 'Price must be non-negative'
  if (input.compare_price != null && (input.compare_price as number) < 0)
    return 'Compare price must be non-negative'
  return null
}

export async function createVariant(input: VariantInput): Promise<Result<{ id: string }>> {
  await requireAdmin()
  const err = validateVariant(input)
  if (err) return { ok: false, error: err }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('product_variants')
    .insert({
      product_id: input.product_id,
      sku: input.sku.trim().toUpperCase(),
      color: input.color || null,
      size: input.size || null,
      price: input.price,
      compare_price: input.compare_price ?? null,
      weight_grams: input.weight_grams ?? 0,
      is_active: input.is_active ?? true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  // Bootstrap an inventory row so the variant is queryable without a separate insert.
  const variantId = (data as { id: string }).id
  await admin.from('inventory').insert({
    variant_id: variantId,
    qty_available: input.initial_qty ?? 0,
    reorder_level: input.reorder_level ?? 5,
  })

  revalidatePath(`/products/${input.product_id}`)
  return { ok: true, data: { id: variantId } }
}

export async function updateVariant(input: VariantInput): Promise<Result> {
  await requireAdmin()
  if (!input.id) return { ok: false, error: 'Missing variant id' }
  const err = validateVariant(input)
  if (err) return { ok: false, error: err }

  const admin = getAdminClient()
  const { error } = await admin
    .from('product_variants')
    .update({
      sku: input.sku.trim().toUpperCase(),
      color: input.color || null,
      size: input.size || null,
      price: input.price,
      compare_price: input.compare_price ?? null,
      weight_grams: input.weight_grams ?? 0,
      is_active: input.is_active ?? true,
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/products/${input.product_id}`)
  return { ok: true }
}

export async function deleteVariant(productId: string, variantId: string): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()
  // inventory row cascades via FK ON DELETE CASCADE
  const { error } = await admin.from('product_variants').delete().eq('id', variantId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/products/${productId}`)
  return { ok: true }
}

// ─────────────────────────────────────────────
// Images (Supabase Storage 'product-images' bucket)
// ─────────────────────────────────────────────

export async function uploadProductImage(formData: FormData): Promise<Result<{ url: string }>> {
  await requireAdmin()
  const productId = formData.get('product_id') as string | null
  const file = formData.get('file') as File | null
  const altText = (formData.get('alt_text') as string | null) ?? null

  if (!productId) return { ok: false, error: 'Missing product_id' }
  if (!file || file.size === 0) return { ok: false, error: 'No file selected' }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'Max image size is 5 MB' }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `${productId}/${crypto.randomUUID()}.${ext}`

  const admin = getAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('product-images')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return { ok: false, error: uploadError.message }

  const { data: pub } = admin.storage.from('product-images').getPublicUrl(path)

  // Check if any image already exists for the product — if not, mark this one primary.
  const { data: existing } = await admin
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .limit(1)
  const isPrimary = !existing || existing.length === 0

  const { error: rowError } = await admin.from('product_images').insert({
    product_id: productId,
    storage_path: path,
    url: pub.publicUrl,
    alt_text: altText,
    is_primary: isPrimary,
  })

  if (rowError) {
    // Roll back the upload if the row insert fails.
    await admin.storage.from('product-images').remove([path])
    return { ok: false, error: rowError.message }
  }

  revalidatePath(`/products/${productId}`)
  return { ok: true, data: { url: pub.publicUrl } }
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
  storagePath: string,
): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()

  await admin.storage.from('product-images').remove([storagePath])
  const { error } = await admin.from('product_images').delete().eq('id', imageId)
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/products/${productId}`)
  return { ok: true }
}

export async function setPrimaryImage(
  productId: string,
  imageId: string,
): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()

  // Clear is_primary on all images for this product, then set on the chosen one.
  const { error: clearError } = await admin
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)
  if (clearError) return { ok: false, error: clearError.message }

  const { error: setError } = await admin
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
  if (setError) return { ok: false, error: setError.message }

  revalidatePath(`/products/${productId}`)
  return { ok: true }
}
