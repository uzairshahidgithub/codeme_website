import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AttendanceManager } from '@/components/admin/AttendanceManager'

interface PageProps { params: Promise<{ id: string }> }

export default async function AttendancePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, title, cert_enabled, cert_template_url, starts_at')
    .eq('id', id)
    .single()
  if (!event) notFound()

  const { data: regs } = await supabase
    .from('event_registrations')
    .select('id, user_id, registered_at, attended, cert_issued, cert_url')
    .eq('event_id', id)
    .order('registered_at', { ascending: true })

  const userIds = (regs ?? []).map((r) => r.user_id)
  let profilesById: Record<string, { username: string | null; first_name: string | null }> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, first_name')
      .in('id', userIds)
    profilesById = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, { username: p.username, first_name: p.first_name }]),
    )
  }

  const rows = (regs ?? []).map((r) => {
    const p = profilesById[r.user_id]
    const name = p?.first_name || p?.username || '—'
    const handle = p?.username ? `@${p.username}` : '—'
    return { ...r, name, email: handle }
  })

  return (
    <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · events · attendance</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>{event.title}</h1>
        <p className="text-text-tertiary mt-1" style={{ fontSize: 14 }}>Manage attendance and issue certificates.</p>
      </header>
      <AttendanceManager
        eventId={event.id}
        certEnabled={event.cert_enabled && !!event.cert_template_url}
        rows={rows}
      />
    </div>
  )
}
