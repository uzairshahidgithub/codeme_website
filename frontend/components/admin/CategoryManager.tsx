'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCategoryAction, upsertCategoryAction } from '@/lib/admin/content-actions'
import { CategorySchema, type CategoryInput, type CategoryKind, type CategoryRow } from '@/lib/schemas/categories'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'

interface Props {
  initial: CategoryRow[]
}

const EMPTY: CategoryInput = {
  slug: '',
  label: '',
  kind: 'event',
  color: '#3B82F6',
  sort_order: 0,
}

export function CategoryManager({ initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<CategoryInput & { id?: string }>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function editRow(row: CategoryRow) {
    setForm({
      id: row.id,
      slug: row.slug,
      label: row.label,
      kind: row.kind,
      color: row.color,
      sort_order: row.sort_order,
    })
    setError(null)
  }

  function resetForm() {
    setForm(EMPTY)
    setError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = CategorySchema.safeParse(form)
    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      setError(msg ?? 'Invalid category')
      return
    }
    setSaving(true)
    try {
      await upsertCategoryAction({ ...parsed.data, id: form.id })
      resetForm()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr 1fr 80px 80px 120px', background: 'var(--bg-surface)', padding: '16px 24px', gap: 12 }}>
          <Head>Label</Head>
          <Head>Slug</Head>
          <Head>Kind</Head>
          <Head>Order</Head>
          <Head>Actions</Head>
        </div>
        {initial.map((row) => (
          <div key={row.id} className="grid items-center" style={{ gridTemplateColumns: '1fr 1fr 80px 80px 120px', padding: '14px 24px', gap: 12, borderTop: '1px solid var(--border)' }}>
            <span className="text-text-primary font-medium">{row.label}</span>
            <span className="text-text-secondary text-sm">{row.slug}</span>
            <span className="text-text-secondary text-sm capitalize">{row.kind}</span>
            <span className="text-text-secondary text-sm">{row.sort_order}</span>
            <div className="flex gap-3">
              <button type="button" onClick={() => editRow(row)} className="text-text-link text-sm">Edit</button>
              <AdminDeleteButton id={row.id} label={row.label} deleteAction={deleteCategoryAction} />
            </div>
          </div>
        ))}
        {initial.length === 0 && (
          <p className="text-text-tertiary text-center py-8 text-sm">No categories yet.</p>
        )}
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-[26px] border border-border-subtle bg-bg-surface flex flex-col gap-4">
        <h2 className="text-text-primary font-semibold">{form.id ? 'Edit category' : 'New category'}</h2>
        <input type="text" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Label" className="codemo-input" required />
        <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} placeholder="slug" className="codemo-input" required />
        <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as CategoryKind }))} className="codemo-input">
          <option value="event">Event</option>
          <option value="course">Course</option>
        </select>
        <input type="number" min={0} value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} placeholder="Sort order" className="codemo-input" />
        {error && <p className="text-text-error text-sm">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 text-white rounded-full" style={{ height: 44, background: 'var(--accent-primary)' }}>
            {saving ? 'Saving…' : form.id ? 'Update' : 'Create'}
          </button>
          {form.id && (
            <button type="button" onClick={resetForm} className="px-4 rounded-full border border-border-subtle text-text-secondary">Cancel</button>
          )}
        </div>
      </form>
    </div>
  )
}

function Head({ children }: { children: React.ReactNode }) {
  return <div className="text-text-muted text-xs font-medium uppercase tracking-wide">{children}</div>
}
