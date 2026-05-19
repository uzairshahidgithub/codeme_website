import { createClient } from '@/lib/supabase/server'
import type { EventRow } from '@/lib/schemas/events'
import { EventsTabs } from '@/components/events/EventsTabs'

export const dynamic = 'force-dynamic'

const SELECT_COLS =
  'id, title, description, mode, location_title, location_link, category, starts_at, ends_at, status, is_recurring, recurrence_rule, recurrence_label, banner_url, max_attendees, cert_enabled, cert_template_url'

export default async function EventsPage() {
  const supabase = await createClient()

  let userId: string | null = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    userId = null
  }
  const isAuthed = !!userId

  const nowIso = new Date().toISOString()
  const monthBack = new Date(); monthBack.setMonth(monthBack.getMonth() - 6)
  const yearAhead = new Date(); yearAhead.setFullYear(yearAhead.getFullYear() + 2)

  const { data: rows } = await supabase
    .from('events')
    .select(SELECT_COLS)
    .in('status', ['published', 'completed', 'cancelled'])
    .gte('starts_at', monthBack.toISOString())
    .lte('starts_at', yearAhead.toISOString())
    .order('starts_at', { ascending: true })

  const allEvents = (rows ?? []) as EventRow[]
  const upcoming = allEvents
    .filter((e) => e.starts_at > nowIso && e.status === 'published')
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const past = allEvents
    .filter((e) => e.ends_at < nowIso)
    .sort((a, b) => b.ends_at.localeCompare(a.ends_at))

  let registeredIds: string[] = []
  let attendedMap: Record<string, { attended: boolean; cert_url: string | null }> = {}
  if (userId) {
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('event_id, attended, cert_url')
      .eq('user_id', userId)
    if (regs) {
      registeredIds = regs.map((r) => r.event_id)
      attendedMap = Object.fromEntries(
        regs.map((r) => [r.event_id, { attended: r.attended, cert_url: r.cert_url }]),
      )
    }
  }

  return (
    <div className="px-4 md:px-10 py-6 md:py-8 max-w-[1400px] mx-auto w-full">
      <header className="mb-6 md:mb-8">
        <span className="home-mono-eyebrow">events</span>
        <h1 className="text-text-primary mt-2 leading-snug text-2xl md:text-4xl font-bold">
          Community <strong style={{ color: 'var(--accent-primary)' }}>Events</strong>
        </h1>
        <p className="text-text-tertiary mt-2 text-sm md:text-[15px]">
          Browse upcoming and past events. Click any event for details and to register.
        </p>
      </header>

      <EventsTabs
        upcoming={upcoming}
        past={past}
        allForCalendar={allEvents.filter((e) => e.status === 'published')}
        isAuthed={isAuthed}
        registeredIds={registeredIds}
        attendedMap={attendedMap}
      />
    </div>
  )
}
