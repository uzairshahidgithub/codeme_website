import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteCourseAction } from '@/lib/admin/content-actions'
import type { CourseRow } from '@/lib/schemas/courses'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { FeaturedCourseToggle } from '@/components/admin/FeaturedCourseToggle'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  const supabase = createAdminClient()
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, level, instructor_name, duration_hours, enrolled_count, category, status, is_featured, featured_label, featured_sort_order')
    .order('is_featured', { ascending: false })
    .order('featured_sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  const featuredCount = (courses ?? []).filter((c) => c.is_featured).length

  return (
    <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <header className="flex items-end justify-between mb-8 gap-6 flex-wrap">
        <div>
          <span className="home-mono-eyebrow">admin · courses</span>
          <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Course Management</h1>
          <p className="text-text-tertiary mt-1" style={{ fontSize: 14 }}>
            Published courses appear on the homepage and Eduto. {featuredCount} featured course{featuredCount === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/categories" className="text-text-link text-sm self-center">Manage categories</Link>
          <Link
            href="/admin/courses/new"
            style={{
              height: 44, padding: '0 22px', borderRadius: 999, background: 'var(--accent-primary)',
              color: '#fff', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center',
            }}
          >
            + New Course
          </Link>
        </div>
      </header>

      {error && (
        <p className="text-text-error text-sm mb-4">
          Failed to load courses: {error.message}
        </p>
      )}

      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div className="grid items-center" style={{ gridTemplateColumns: '48px 2fr 1fr 1fr 1fr 1fr 160px', background: 'var(--bg-surface)', padding: '16px 24px', gap: 12 }}>
          {['★', 'Course', 'Level', 'Instructor', 'Hours', 'Status', 'Actions'].map((h) => (
            <div key={h} className="text-text-muted text-xs font-medium uppercase tracking-wide">{h}</div>
          ))}
        </div>
        {(courses ?? []).map((course) => (
            <div key={course.id} className="grid items-center" style={{ gridTemplateColumns: '48px 2fr 1fr 1fr 1fr 1fr 160px', padding: '14px 24px', gap: 12, borderTop: '1px solid var(--border)' }}>
              <FeaturedCourseToggle courseId={course.id} featured={!!course.is_featured} />
              <div className="min-w-0">
                <div className="text-text-primary font-medium truncate">{course.title}</div>
                {course.is_featured && course.featured_label && (
                  <div className="text-text-tertiary text-xs truncate">{course.featured_label}</div>
                )}
              </div>
              <div className="text-text-secondary text-sm capitalize">{course.level}</div>
              <div className="text-text-secondary text-sm truncate">{course.instructor_name}</div>
              <div className="text-text-secondary text-sm">{course.duration_hours}h</div>
              <div className="text-text-secondary text-sm capitalize">{course.status}</div>
              <div className="flex gap-3 items-center">
                <Link href={`/admin/courses/${course.id}/edit`} className="text-text-link text-sm">Edit</Link>
                <AdminDeleteButton id={course.id} label={course.title} deleteAction={deleteCourseAction} />
              </div>
            </div>
        ))}
        {(!courses || courses.length === 0) && (
          <p className="text-text-tertiary text-center py-10 text-sm">No courses yet.</p>
        )}
      </div>
    </div>
  )
}
