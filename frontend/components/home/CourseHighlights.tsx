import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { CourseStack, type CourseItem } from './CourseStack'

const fetchCourses = unstable_cache(
  async (): Promise<CourseItem[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, level, instructor_name, duration_hours, enrolled_count, thumbnail_url')
      .eq('status', 'published')
      .order('enrolled_count', { ascending: false })
      .limit(5)
    if (error) {
      console.warn('courses fetch failed:', error.message)
      return []
    }
    return (data ?? []) as CourseItem[]
  },
  ['home:courses'],
  { revalidate: 300, tags: ['courses'] },
)

const FALLBACK: CourseItem[] = [
  { id: 's1', title: 'Foundations of applied AI', level: 'beginner',     instructor_name: 'Aanya Rao',      duration_hours: 8,  enrolled_count: 1240 },
  { id: 's2', title: 'Defensive web security',     level: 'intermediate', instructor_name: 'Marcus Lefèvre', duration_hours: 12, enrolled_count: 860 },
  { id: 's3', title: 'Designing with TypeScript',  level: 'advanced',     instructor_name: 'Priya Krishnan', duration_hours: 10, enrolled_count: 512 },
  { id: 's4', title: 'Threat modelling for indie devs', level: 'intermediate', instructor_name: 'Diego Martín', duration_hours: 6, enrolled_count: 410 },
  { id: 's5', title: 'AI agents from zero',        level: 'beginner',     instructor_name: 'Hana Sato',      duration_hours: 5,  enrolled_count: 320 },
]

function ChevIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6"/>
    </svg>
  )
}

export function CourseSkeletonStrip() {
  return (
    <section className="courses" aria-busy="true">
      <div className="courses-inner">
        <header className="sec-head">
          <h2>Learn something new this week</h2>
        </header>
        <div className="course-slider" aria-hidden="true" />
      </div>
    </section>
  )
}

export async function CourseHighlights() {
  const fetched = await fetchCourses()
  const courses = fetched.length > 0 ? fetched : FALLBACK

  return (
    <section className="courses" data-screen-label="04 Courses">
      <div className="courses-inner">
        <header className="sec-head">
          <h2>Learn something new this week</h2>
          <Link href="/eduto" className="ghost-pill big">Explore all courses <ChevIcon /></Link>
        </header>
        <CourseStack items={courses} />
      </div>
    </section>
  )
}
