import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { SpotlightCard } from './SpotlightCard'
import { AddToCalendar } from './AddToCalendar'
import { SoftReveal } from './SoftReveal'

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

const FALLBACK_EVENTS: EventRow[] = [
  { id: 'sample-1', title: 'Threat modelling for indie devs', description: 'STRIDE, attack trees and where most teams over-engineer.', starts_at: new Date(Date.now() + 7 * 86400000).toISOString(), category: 'workshop', max_attendees: 7, banner_url: null },
  { id: 'sample-2', title: 'AI agents from zero — build a research bot', description: 'Tools, traces and evals. Ship a working agent in two hours.', starts_at: new Date(Date.now() + 10 * 86400000).toISOString(), category: 'bootcamp', max_attendees: 42, banner_url: null },
  { id: 'sample-3', title: 'Career clinic: from junior to staff', description: 'Mock reviews, salary calibration and a promo doc that lands.', starts_at: new Date(Date.now() + 21 * 86400000).toISOString(), category: 'seminar', max_attendees: 18, banner_url: null },
]

function ArrowSvg({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

function formatDateParts(iso: string): { day: string; date: string; time: string; countdown: string } {
  const d = new Date(iso)
  const day = d.toLocaleString('en-GB', { weekday: 'short' })
  const date = d.toLocaleString('en-GB', { day: '2-digit', month: 'short' })
  const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const daysAway = Math.max(0, Math.round((d.getTime() - Date.now()) / 86400000))
  const countdown =
    daysAway === 0 ? 'Today' :
    daysAway === 1 ? 'Tomorrow' :
    daysAway < 7  ? `In ${daysAway} days` :
                     `In ${Math.round(daysAway / 7)} weeks`
  return { day, date, time, countdown }
}

function EventCard({ e }: { e: EventRow }) {
  const t = formatDateParts(e.starts_at)
  return (
    <SpotlightCard
      accent="var(--blue)"
      className="h-full"
      innerClassName="p-7 md:p-8 flex flex-col justify-between h-full min-h-[300px]"
    >
      <header className="flex items-center justify-between text-[12px] text-text-tertiary">
        <span className="font-medium tracking-tight">{t.day} {t.date} · {t.time}</span>
        <span className="font-medium tracking-tight">{t.countdown}</span>
      </header>

      <div>
        <h3 className="font-sans font-medium text-text-primary text-[22px] md:text-[24px] leading-[1.18] tracking-[-0.015em]">
          {e.title}
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-text-secondary line-clamp-2 font-light">
          {e.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight text-text-secondary border border-border-subtle bg-text-primary/[0.02] capitalize">
            {e.category}
          </span>
          {e.max_attendees != null && e.max_attendees < 10 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight" style={{
              color: 'var(--accent-coral)',
              border: '1px solid color-mix(in oklab, var(--accent-coral) 30%, transparent)',
              background: 'color-mix(in oklab, var(--accent-coral) 8%, transparent)',
            }}>
              {e.max_attendees} seats left
            </span>
          )}
        </div>
      </div>

      <footer className="flex items-center justify-between gap-3 pt-5 border-t border-border-subtle/70">
        <Link
          href="/events"
          className="
            inline-flex items-center gap-1.5 px-4 py-2 rounded-full
            text-[13px] font-medium text-white
            transition-transform duration-200 hover:-translate-y-0.5
          "
          style={{
            background: 'var(--blue)',
            boxShadow: '0 8px 22px -12px color-mix(in oklab, var(--blue) 55%, transparent)',
          }}
        >
          Join
          <ArrowSvg size={11} />
        </Link>
        <AddToCalendar
          event={{
            title: e.title,
            description: e.description,
            start: e.starts_at,
            location: 'Codemo Teams — online',
          }}
        />
      </footer>
    </SpotlightCard>
  )
}

export function EventsSkeleton() {
  return (
    <section className="px-3 sm:px-4 md:px-6 py-12 md:py-20" aria-busy="true">
      <div className="max-w-[1480px] mx-auto">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card min-h-[260px] animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  )
}

export async function EventsHighlights() {
  const fetched = await fetchUpcomingEvents()
  const events = (fetched.length > 0 ? fetched : FALLBACK_EVENTS).slice(0, 3)

  return (
    <section data-screen-label="04 Events" className="px-4 md:px-8 py-10 md:py-24">
      <div className="max-w-[1480px] mx-auto">
        <SoftReveal as="header" className="flex items-end justify-between flex-wrap gap-4 mb-8 md:mb-14">
          <div className="min-w-0">
            <h2 className="font-sans font-semibold tracking-normal text-text-primary leading-snug text-2xl md:text-4xl lg:text-5xl">
              Live this month.
            </h2>
            <p className="mt-3 text-text-secondary max-w-prose font-normal text-sm md:text-lg leading-[1.5]">
              Three rooms open this month. No replays, no sponsors, just engineers and the work.
            </p>
          </div>
          <Link
            href="/events"
            className="text-sm font-medium text-text-secondary hover:text-text-primary link-trail transition-colors"
          >
            See all events
          </Link>
        </SoftReveal>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      </div>
    </section>
  )
}
