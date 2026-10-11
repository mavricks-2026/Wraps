'use server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { getAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@goodsly/utils'

export interface CategoryInput {
  id?: string
  name: string
  slug?: string | null
  description?: string | null
  parent_id?: string | null
  image_url?: string | null
  sort_order?: number
  is_active?: boolean
}

type Result<T = void> = { ok: true; data?: T } | { ok: false; error: string }

function validate(input: CategoryInput): string | null {
  if (!input.name?.trim()) return 'Name is required'
  if (input.sort_order != null && !Number.isFinite(input.sort_order))
    return 'Sort order must be a number'
  return null
}

export async function createCategory(input: CategoryInput): Promise<Result<{ id: string }>> {
  await requireAdmin()
  const err = validate(input)
  if (err) return { ok: false, error: err }

  const admin = getAdminClient()
  // Auto-slugify from the provided slug, falling back to the name.
  const slug = slugify(input.slug?.trim() || input.name)
  const { data, error } = await admin
    .from('categories')
    .insert({
      name: input.name.trim(),
      slug,
      description: input.description ?? null,
      parent_id: input.parent_id || null,
      image_url: input.image_url ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  revalidatePath('/categories')
  return { ok: true, data: { id: (data as { id: string }).id } }
}

export async function updateCategory(input: CategoryInput): Promise<Result> {
  await requireAdmin()
  if (!input.id) return { ok: false, error: 'Missing category id' }
  const err = validate(input)
  if (err) return { ok: false, error: err }

  // A category cannot be its own parent.
  if (input.parent_id && input.parent_id === input.id) {
    return { ok: false, error: 'A category cannot be its own parent' }
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from('categories')
    .update({
      name: input.name.trim(),
      slug: slugify(input.slug?.trim() || input.name),
      description: input.description ?? null,
      parent_id: input.parent_id || null,
      image_url: input.image_url ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .eq('id', input.id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/categories')
  return { ok: true }
}

export async function toggleCategory(categoryId: string, active: boolean): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()
  const { error } = await admin
    .from('categories')
    .update({ is_active: active })
    .eq('id', categoryId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/categories')
  return { ok: true }
}

export async function setSortOrder(categoryId: string, sortOrder: number): Promise<Result> {
  await requireAdmin()
  if (!Number.isFinite(sortOrder)) return { ok: false, error: 'Sort order must be a number' }
  const admin = getAdminClient()
  const { error } = await admin
    .from('categories')
    .update({ sort_order: Math.trunc(sortOrder) })
    .eq('id', categoryId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/categories')
  return { ok: true }
}

export async function deleteCategory(categoryId: string): Promise<Result> {
  await requireAdmin()
  const admin = getAdminClient()

  // Guard: warn if products still reference this category.
  const { count: productCount, error: countError } = await admin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
  if (countError) return { ok: false, error: countError.message }
  if ((productCount ?? 0) > 0) {
    return {
      ok: false,
      error: `Cannot delete: ${productCount} product(s) still reference this category. Reassign them first.`,
    }
  }

  // Guard: warn if child categories exist.
  const { count: childCount, error: childError } = await admin
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('parent_id', categoryId)
  if (childError) return { ok: false, error: childError.message }
  if ((childCount ?? 0) > 0) {
    return {
      ok: false,
      error: `Cannot delete: ${childCount} subcategory(ies) reference this as their parent. Reassign them first.`,
    }
  }

  const { error } = await admin.from('categories').delete().eq('id', categoryId)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/categories')
  return { ok: true }
}

// ─────────────────────────────────────────────
// Image upload (Supabase Storage 'banner-images' bucket)
// ─────────────────────────────────────────────

export async function uploadCategoryImage(
  formData: FormData,
): Promise<Result<{ url: string }>> {
  await requireAdmin()
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { ok: false, error: 'No file selected' }
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'Max image size is 10 MB' }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `categories/${crypto.randomUUID()}.${ext}`

  const admin = getAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('banner-images')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return { ok: false, error: uploadError.message }

  const { data: pub } = admin.storage.from('banner-images').getPublicUrl(path)
  return { ok: true, data: { url: pub.publicUrl } }
}
