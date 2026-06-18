import { CourseForm } from '@/components/admin/CourseForm'

export default function NewCoursePage() {
  return (
    <div className="px-6 md:px-10 py-8 max-w-[900px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · courses · new</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Create Course</h1>
      </header>
      <CourseForm mode="create" />
    </div>
  )
}
