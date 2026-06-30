import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteEnrollmentAction, updateEnrollmentStatusAction } from '@/lib/admin/enrollment-actions'
import type { CourseEnrollmentRow, EnrollmentStatus } from '@/lib/schemas/enrollments'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'
import { EnrollmentStatusSelect } from '@/components/admin/EnrollmentStatusSelect'

export const dynamic = 'force-dynamic'

const SELECT =
  'id, payment_id, user_id, course_id, course_title, student_name, student_email, student_phone, student_city, amount, status, cleared_at, created_at, updated_at'

function statusColour(s: EnrollmentStatus) {
  switch (s) {
    case 'verified': return { bg: 'rgba(16,185,129,0.18)', fg: '#10B981', border: 'rgba(16,185,129,0.4)' }
    case 'cleared':  return { bg: 'rgba(156,163,175,0.18)', fg: '#9CA3AF', border: 'rgba(156,163,175,0.4)' }
    default:         return { bg: 'rgba(245,158,11,0.18)', fg: '#F59E0B', border: 'rgba(245,158,11,0.4)' }
  }
}

export default async function AdminEnrollmentsPage() {
  const supabase = createAdminClient()
  const { data: rows, error } = await supabase
    .from('course_enrollments')
    .select(SELECT)
    .order('created_at', { ascending: false })

  const enrollments = (rows ?? []) as CourseEnrollmentRow[]
  const pending = enrollments.filter((e) => e.status === 'pending').length

  return (
    <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · enrollments</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Eduto Enrollments</h1>
        <p className="text-text-tertiary mt-1 text-sm">
          Course sign-ups from Eduto — synced when users enroll or clear history.
          {pending > 0 && ` · ${pending} pending`}
        </p>
      </header>

      {error && <p className="text-text-error text-sm mb-4">Failed to load: {error.message}</p>}

      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div className="grid items-center" style={{ gridTemplateColumns: '1fr 1fr 120px 1fr 140px 160px', background: 'var(--bg-surface)', padding: '16px 24px', gap: 12 }}>
          <Cell>Student</Cell>
          <Cell>Course</Cell>
          <Cell>Payment ID</Cell>
          <Cell>Contact</Cell>
          <Cell>Status</Cell>
          <Cell>Actions</Cell>
        </div>

        {enrollments.map((e) => {
          const colour = statusColour(e.status)
          return (
            <div key={e.id} className="grid items-center" style={{ gridTemplateColumns: '1fr 1fr 120px 1fr 140px 160px', padding: '14px 24px', gap: 12, borderTop: '1px solid var(--border)' }}>
              <div>
                <div className="text-text-primary text-sm font-medium">{e.student_name}</div>
                <div className="text-text-tertiary text-xs">{e.student_city}</div>
              </div>
              <div className="text-text-secondary text-sm truncate">{e.course_title}</div>
              <div className="text-text-secondary text-xs font-mono truncate">{e.payment_id}</div>
              <div className="text-text-secondary text-xs truncate">{e.student_email}</div>
              <EnrollmentStatusSelect id={e.id} status={e.status} colour={colour} updateAction={updateEnrollmentStatusAction} />
              <div className="flex gap-3 items-center">
                <Link href={`mailto:${e.student_email}`} className="text-text-link text-sm">Email</Link>
                <AdminDeleteButton id={e.id} label={e.student_name} deleteAction={deleteEnrollmentAction} />
              </div>
            </div>
          )
        })}

        {enrollments.length === 0 && (
          <p className="text-text-tertiary text-center py-10 text-sm">No enrollments yet.</p>
        )}
      </div>
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-text-muted text-xs font-medium uppercase tracking-wide">{children}</div>
  )
}
