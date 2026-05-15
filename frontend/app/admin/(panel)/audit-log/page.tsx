import { AdminStub } from '@/components/admin/AdminStub'

// TODO: implement audit log filtering feature in next sprint
export default function AdminAuditLogPage() {
  return (
    <AdminStub
      eyebrow="audit log"
      title="Audit Log"
      description="Full immutable record of every admin action. Filter by actor, action and date range. Read-only at the database level."
      todo="// TODO: implement audit-log filters in next sprint"
    />
  )
}
