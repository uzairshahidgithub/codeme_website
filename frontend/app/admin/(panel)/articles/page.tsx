import { AdminStub } from '@/components/admin/AdminStub'

// TODO: implement articles management feature in next sprint
export default function AdminArticlesPage() {
  return (
    <AdminStub
      eyebrow="articles"
      title="Article Management"
      description="Draft, edit, publish and archive editorial articles. RLS already gates read on status='published'."
      todo="// TODO: implement articles feature in next sprint"
    />
  )
}
