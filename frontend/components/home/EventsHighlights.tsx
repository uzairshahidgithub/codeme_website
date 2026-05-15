import Link from 'next/link'
import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

interface EventRow {
  id: string
  title: string
  description: string
  starts_at: string
  category: string
  max_attendees: number | null
  banner_url: string | null
}

const fetchUpcomingEvents = unstable_cache(
  async (): Promise<EventRow[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('events')
      .select('id, title, description, starts_at, category, max_attendees, banner_url')
      .gte('starts_at', new Date().toISOString())
      .eq('status', 'published')
      .order('starts_at', { ascending: true })
      .limit(3)
    if (error) {
      console.warn('events fetch failed:', error.message)
      return []
    }
    return (data ?? []) as EventRow[]
  },
  ['home:events:upcoming'],
  { revalidate: 60, tags: ['events'] },
)

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>
    </svg>
  )
}
function ChevIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6"/>
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8"/>
    </svg>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

const FALLBACK_EVENTS: EventRow[] = [
  { id: 'sample-1', title: 'Cybersec Live: Threat modelling for indie devs', description: 'A practitioner walkthrough — STRIDE, attack trees, and where most teams over-engineer.', starts_at: new Date(Date.now() + 7 * 86400000).toISOString(), category: 'workshop', max_attendees: 7, banner_url: null },
  { id: 'sample-2', title: 'AI agents from zero — build a research bot', description: 'Tools, traces and evals. We ship a working agent in two hours, repo provided.', starts_at: new Date(Date.now() + 10 * 86400000).toISOString(), category: 'bootcamp', max_attendees: 42, banner_url: null },
  { id: 'sample-3', title: 'Career clinic: from junior to staff', description: 'Mock reviews, salary calibration, and how to write a promo doc that lands.', starts_at: new Date(Date.now() + 21 * 86400000).toISOString(), category: 'seminar', max_attendees: 18, banner_url: null },
]

function EventCard({ e }: { e: EventRow }) {
  return (
    <article className="evt-card-rich">
      {/* Optional admin-uploaded banner — sits underneath at low opacity */}
      {e.banner_url && (
        <div className="evt-bg" aria-hidden="true">
          <Image src={e.banner_url} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
          <div className="evt-bg-veil" />
        </div>
      )}

      <div className="evt-content">
        <header className="evt-head">
          <span className="evt-type">{e.category}</span>
          <div className="evt-row"><CalIcon /><span>{formatDate(e.starts_at)}</span></div>
        </header>

        <h3 className="evt-title-lg">{e.title}</h3>
        <p className="evt-desc">{e.description}</p>

        {e.max_attendees != null && e.max_attendees < 10 && (
          <div className="evt-warn">Only {e.max_attendees} seats left</div>
        )}

        <div className="evt-foot-rich">
          <Link href="/events" className="pill pill-primary pill-sm" aria-label={`Join ${e.title}`}>
            <span className="pill-icon"><ArrowIcon /></span>
            <span>Join Now</span>
          </Link>
        </div>
      </div>
    </article>
  )
}

export function EventsSkeleton() {
  return (
    <section className="events" aria-busy="true">
      <header className="sec-head">
        <h2>What&apos;s happening this month</h2>
      </header>
      <div className="card-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="evt-card-rich" aria-hidden="true">
            <div className="evt-content">
              <div style={{ height: 14, background: 'var(--input-glass)', borderRadius: 8, width: '40%' }} />
              <div style={{ height: 24, background: 'var(--input-glass)', borderRadius: 8, width: '85%' }} />
              <div style={{ height: 14, background: 'var(--input-glass)', borderRadius: 8, width: '95%' }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export async function EventsHighlights() {
  const fetched = await fetchUpcomingEvents()
  const events = fetched.length > 0 ? fetched : FALLBACK_EVENTS

  return (
    <section className="events" data-screen-label="03 Events">
      <header className="sec-head">
        <h2>What&apos;s happening this month</h2>
        <Link href="/events" className="ghost-pill big">See all events <ChevIcon size={13} /></Link>
      </header>
      <div className="card-grid">
        {events.map((e) => <EventCard key={e.id} e={e} />)}
      </div>
    </section>
  )
}
