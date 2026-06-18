import { createAdminClient } from '@/lib/supabase/admin'
import { CategoryManager } from '@/components/admin/CategoryManager'
import type { CategoryRow } from '@/lib/schemas/categories'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('content_categories')
    .select('id, slug, label, kind, color, sort_order')
    .order('kind')
    .order('sort_order', { ascending: true })

  return (
    <div className="px-6 md:px-10 py-8 max-w-[1200px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · categories</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Topic Categories</h1>
        <p className="text-text-tertiary mt-1 text-sm">
          Manage filter topics for events and courses. Slugs must match event/course category values.
        </p>
      </header>
      {error && <p className="text-text-error text-sm mb-4">{error.message}</p>}
      <CategoryManager initial={(data ?? []) as CategoryRow[]} />
    </div>
  )
}
