'use client'
import { useState, useTransition } from 'react'
import { Button, Badge } from '@goodsly/ui'
import { CategoryForm, type CategoryValue, type ParentOption } from './CategoryForm'
import { deleteCategory, setSortOrder, toggleCategory } from './actions'

export interface CategoryRow extends CategoryValue {
  parent_name: string | null
  product_count: number
}

interface Props {
  categories: CategoryRow[]
}

export function CategoriesTable({ categories }: Props) {
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Parent dropdown options: every category (the edit form excludes the row itself).
  const allParents: ParentOption[] = categories.map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="space-y-6">
      {creating ? (
        <CategoryForm parents={allParents} onDone={() => setCreating(false)} />
      ) : (
        <Button onClick={() => setCreating(true)}>+ New category</Button>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-stone-500 py-12 text-center bg-white border border-stone-200">
          No categories yet. Create one above.
        </p>
      ) : (
        <div className="bg-white border border-stone-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
              <tr className="text-left">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Parent</th>
                <th className="px-5 py-3 font-medium">Sort</th>
                <th className="px-5 py-3 font-medium">Products</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {categories.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id}>
                    <td colSpan={7} className="p-4 bg-stone-50">
                      <CategoryForm
                        category={c}
                        parents={allParents.filter((p) => p.id !== c.id)}
                        onDone={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                ) : (
                  <CategoryTableRow
                    key={c.id}
                    category={c}
                    onEdit={() => setEditingId(c.id)}
                  />
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CategoryTableRow({
  category,
  onEdit,
}: {
  category: CategoryRow
  onEdit: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [sortValue, setSortValue] = useState<number>(category.sort_order)

  function saveSort() {
    if (sortValue === category.sort_order) return
    setError(null)
    startTransition(async () => {
      const res = await setSortOrder(category.id, sortValue)
      if (!res.ok) {
        setError(res.error)
        setSortValue(category.sort_order)
      }
    })
  }

  function toggle() {
    setError(null)
    startTransition(async () => {
      const res = await toggleCategory(category.id, !category.is_active)
      if (!res.ok) setError(res.error)
    })
  }

  function remove() {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return
    setError(null)
    startTransition(async () => {
      const res = await deleteCategory(category.id)
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <tr className="hover:bg-stone-50 align-top">
      <td className="px-5 py-3">
        <span className="font-medium text-stone-900">{category.name}</span>
        {category.description && (
          <div className="text-xs text-stone-500">{category.description}</div>
        )}
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </td>
      <td className="px-5 py-3 text-stone-600 font-mono text-xs">{category.slug}</td>
      <td className="px-5 py-3 text-stone-700">{category.parent_name ?? '—'}</td>
      <td className="px-5 py-3">
        <input
          type="number"
          step="1"
          value={sortValue}
          disabled={pending}
          onChange={(e) => setSortValue(Number(e.target.value))}
          onBlur={saveSort}
          className="h-8 w-16 border border-stone-300 bg-white px-2 text-sm focus:border-stone-900 focus:outline-none"
        />
      </td>
      <td className="px-5 py-3 tabular text-stone-700">{category.product_count}</td>
      <td className="px-5 py-3 text-xs uppercase tracking-wider">
        {category.is_active ? (
          <Badge tone="new">Active</Badge>
        ) : (
          <span className="text-stone-400">Inactive</span>
        )}
      </td>
      <td className="px-5 py-3">
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onEdit} disabled={pending}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={toggle} disabled={pending}>
            {category.is_active ? 'Disable' : 'Enable'}
          </Button>
          <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  )
}
