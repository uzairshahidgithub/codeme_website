import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" | Search | Codemo Teams` : 'Search | Codemo Teams',
    description: 'Search events, courses, and community content on Codemo Teams.',
    robots: { index: false },
  }
}

interface EventRow { id: string; title: string; description: string; category: string; starts_at: string }
interface CourseRow { id: string; title: string; description: string | null; level: string }

async function searchAll(q: string): Promise<{ events: EventRow[]; courses: CourseRow[] }> {
  if (!q.trim()) return { events: [], courses: [] }
  const supabase = createPublicClient()
  const term = `%${q}%`

  const [eventsRes, coursesRes] = await Promise.allSettled([
    supabase
      .from('events')
      .select('id, title, description, category, starts_at')
      .ilike('title', term)
      .eq('status', 'published')
      .order('starts_at', { ascending: true })
      .limit(8),
    supabase
      .from('courses')
      .select('id, title, description, level')
      .ilike('title', term)
      .limit(8),
  ])

  return {
    events:  eventsRes.status  === 'fulfilled' ? (eventsRes.value.data  ?? []) as EventRow[]  : [],
    courses: coursesRes.status === 'fulfilled' ? (coursesRes.value.data ?? []) as CourseRow[] : [],
  }
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>
    </svg>
  )
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  )
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = '' } = await searchParams
  const query = q.trim()
  const { events, courses } = query ? await searchAll(query) : { events: [], courses: [] }
  const total = events.length + courses.length

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-24">

        {/* Header */}
        <header className="mb-10">
          {query ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-3">Search results</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {total > 0
                  ? <><span className="gradient-text-blue">{total} result{total !== 1 ? 's' : ''}</span> for &ldquo;{query}&rdquo;</>
                  : <>No results for &ldquo;{query}&rdquo;</>
                }
              </h1>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Search</h1>
              <p className="text-text-secondary">Type a query in the search bar above to find events and courses.</p>
            </>
          )}
        </header>

        {/* Events results */}
        {events.length > 0 && (
          <section aria-label="Events" className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-4 flex items-center gap-2">
              <CalIcon /> Events
            </h2>
            <ul className="space-y-2">
              {events.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events?id=${e.id}`}
                    className="group flex flex-col gap-1 rounded-2xl border border-border-subtle bg-bg-surface px-5 py-4 hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-text-tertiary">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/10 text-blue-500"><CalIcon /></span>
                      {e.category} · {new Date(e.starts_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[15px] font-semibold group-hover:text-blue-500 transition-colors">{e.title}</span>
                    {e.description && (
                      <span className="text-sm text-text-secondary line-clamp-2">{e.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Courses results */}
        {courses.length > 0 && (
          <section aria-label="Courses">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-tertiary mb-4 flex items-center gap-2">
              <BookIcon /> Courses
            </h2>
            <ul className="space-y-2">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link
                    href="/eduto"
                    className="group flex flex-col gap-1 rounded-2xl border border-border-subtle bg-bg-surface px-5 py-4 hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className="text-[11px] uppercase tracking-widest text-text-tertiary">{c.level}</span>
                    <span className="text-[15px] font-semibold group-hover:text-blue-500 transition-colors">{c.title}</span>
                    {c.description && (
                      <span className="text-sm text-text-secondary line-clamp-2">{c.description}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Empty state */}
        {query && total === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-text-secondary mb-6">We couldn&apos;t find anything matching &ldquo;{query}&rdquo;.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/events" className="pill pill-primary pill-sm">Browse Events</Link>
              <Link href="/eduto" className="pill pill-secondary pill-sm">Browse Courses</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
