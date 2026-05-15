import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { EventRow, EventStatus } from '@/lib/schemas/events'
import { CategoryBadge, ModeBadge, formatShortDate, formatTime } from '@/components/events/EventBadges'

export const dynamic = 'force-dynamic'

const SELECT_COLS =
  'id, title, description, mode, location_title, location_link, category, starts_at, ends_at, status, is_recurring, recurrence_rule, recurrence_label, banner_url, max_attendees, cert_enabled, cert_template_url'

function statusColour(s: EventStatus) {
  switch (s) {
    case 'published': return { bg: 'rgba(16,185,129,0.18)', fg: '#10B981', border: 'rgba(16,185,129,0.4)' }
    case 'draft':     return { bg: 'rgba(156,163,175,0.18)', fg: '#9CA3AF', border: 'rgba(156,163,175,0.4)' }
    case 'cancelled': return { bg: 'rgba(239,68,68,0.18)', fg: '#EF4444', border: 'rgba(239,68,68,0.4)' }
    case 'completed': return { bg: 'rgba(45,127,249,0.18)', fg: '#2D7FF9', border: 'rgba(45,127,249,0.4)' }
    default:          return { bg: 'rgba(156,163,175,0.18)', fg: '#9CA3AF', border: 'rgba(156,163,175,0.4)' }
  }
}

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: events, error } = await supabase
    .from('events').select(SELECT_COLS).order('starts_at', { ascending: false })

  return (
    <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <header className="flex items-end justify-between mb-8 gap-6 flex-wrap">
        <div>
          <span className="home-mono-eyebrow">admin · events</span>
          <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Event Management</h1>
          <p className="text-text-tertiary mt-1" style={{ fontSize: 14 }}>
            Create, publish and manage attendance + certificates.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{
            height: 44, padding: '0 22px', borderRadius: 999, background: 'var(--accent-primary)',
            color: '#fff', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center',
          }}
        >
          + New Event
        </Link>
      </header>

      {error && (
        <div className="text-text-error mb-4" style={{ fontSize: 13 }}>Failed to load events: {error.message}</div>
      )}

      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '32% 1fr 1fr 1fr 1fr 220px',
            background: 'var(--bg-surface)', padding: '16px 24px', gap: 12,
          }}
        >
          <Cell>Event</Cell>
          <Cell>Category</Cell>
          <Cell>Mode</Cell>
          <Cell>Date</Cell>
          <Cell>Status</Cell>
          <Cell>Actions</Cell>
        </div>

        {(events ?? []).map((e) => {
          const ev = e as EventRow
          const colour = statusColour(ev.status)
          return (
            <div
              key={ev.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '32% 1fr 1fr 1fr 1fr 220px',
                padding: '14px 24px', gap: 12,
                borderTop: '1px solid var(--border)',
              }}
            >
              <div className="min-w-0">
                <div className="text-text-primary truncate" style={{ fontSize: 15, fontWeight: 600 }}>{ev.title}</div>
                <div className="text-text-muted truncate" style={{ fontSize: 12 }}>{ev.location_title}</div>
              </div>
              <div><CategoryBadge category={ev.category} size="sm" /></div>
              <div><ModeBadge mode={ev.mode} size="sm" /></div>
              <div className="text-text-secondary" style={{ fontSize: 13 }}>
                {formatShortDate(ev.starts_at)} · {formatTime(ev.starts_at)}
              </div>
              <div>
                <span style={{
                  background: colour.bg, color: colour.fg, border: `1px solid ${colour.border}`,
                  padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
                }}>{ev.status}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/events/${ev.id}/edit`} className="text-text-link" style={{ fontSize: 13 }}>Edit</Link>
                <Link href={`/admin/events/${ev.id}/attendance`} className="text-text-link" style={{ fontSize: 13 }}>Attendance</Link>
              </div>
            </div>
          )
        })}

        {(!events || events.length === 0) && (
          <div className="text-text-tertiary text-center" style={{ padding: 32, fontSize: 14, borderTop: '1px solid var(--border)' }}>
            No events yet. Click <Link href="/admin/events/new" className="text-text-link">+ New Event</Link> to create one.
          </div>
        )}
      </div>
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-text-muted" style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}
