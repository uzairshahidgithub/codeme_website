import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CourseForm } from '@/components/admin/CourseForm'
import type { CourseRow } from '@/lib/schemas/courses'

interface PageProps { params: Promise<{ id: string }> }

export default async function EditCoursePage({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: row } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url, level, instructor_name, instructor_avatar_url, duration_hours, enrolled_count, category, tags, status')
    .eq('id', id)
    .single()

  if (!row) notFound()
  const course = row as CourseRow

  return (
    <div className="px-6 md:px-10 py-8 max-w-[900px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · courses · edit</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Edit Course</h1>
      </header>
      <CourseForm
        mode="edit"
        initial={{
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail_url: course.thumbnail_url ?? '',
          level: course.level,
          instructor_name: course.instructor_name,
          instructor_avatar_url: course.instructor_avatar_url ?? '',
          duration_hours: course.duration_hours,
          enrolled_count: course.enrolled_count,
          category: course.category ?? '',
          tags: course.tags ?? [],
          status: course.status,
        }}
      />
    </div>
  )
}
