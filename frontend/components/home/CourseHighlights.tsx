import { unstable_cache } from 'next/cache'
import { fetchFeaturedCourses } from '@/lib/courses/public'
import { CourseDeck, MobileCourseList } from './CourseDeck'

export interface CourseItem {
  id: string
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
  instructor_name: string
  duration_hours: number
  enrolled_count: number
  thumbnail_url?: string | null
  tags?: string[] | null
  description?: string | null
}

const getHomeCourses = unstable_cache(
  async () => fetchFeaturedCourses(6),
  ['home:courses:featured'],
  { revalidate: 300, tags: ['courses'] },
)

const FALLBACK: CourseItem[] = [
  { id: 's1', title: 'Foundations of applied AI',       level: 'beginner',     instructor_name: 'Aanya Rao',      duration_hours: 8,  enrolled_count: 1240, tags: ['AI', 'Python', 'Foundations'], description: 'A practitioner-led path from "I trained a regression" to a working agent loop. Six modules, three shipped artefacts, no math gatekeeping.' },
  { id: 's2', title: 'Defensive web security',          level: 'intermediate', instructor_name: 'Marcus Lefèvre', duration_hours: 12, enrolled_count: 860,  tags: ['Security', 'OWASP', 'Web'], description: 'OWASP top-ten in production. Real attacks, real fixes, real CVEs — including the kind your linter never finds.' },
  { id: 's3', title: 'Designing with TypeScript',       level: 'advanced',     instructor_name: 'Priya Krishnan', duration_hours: 10, enrolled_count: 512,  tags: ['TypeScript', 'Architecture'], description: 'Going from "TS as a syntax tax" to using the type system to design correct software. Generics, variance, branded types, exhaustiveness.' },
  { id: 's4', title: 'Threat modelling for indie devs', level: 'intermediate', instructor_name: 'Diego Martín',   duration_hours: 6,  enrolled_count: 410,  tags: ['STRIDE', 'Architecture'], description: 'STRIDE, attack trees and the diagrams security teams actually use. A two-evening intensive with a takeaway threat model.' },
  { id: 's5', title: 'AI agents from zero',             level: 'beginner',     instructor_name: 'Hana Sato',      duration_hours: 5,  enrolled_count: 320,  tags: ['Agents', 'LLM'], description: 'Build a research assistant agent. Tools, traces, evals — and the why behind each. Repo provided.' },
  { id: 's6', title: 'Production observability',        level: 'intermediate', instructor_name: 'Wale Adebayo',   duration_hours: 7,  enrolled_count: 286,  tags: ['SRE', 'OpenTelemetry'], description: 'From print statements to spans, metrics and SLOs. Includes an OTel-based reference stack you can ship on Monday.' },
]

export function CourseSkeletonStrip() {
  return (
    <section className="px-3 sm:px-4 md:px-6 py-12 md:py-20" aria-busy="true">
      <div className="max-w-[1180px] mx-auto">
        <div className="h-10 w-64 rounded-md animate-pulse bg-text-tertiary/10 mb-6" />
        <div className="aspect-[16/9] rounded-[26px] glass-card animate-pulse" />
      </div>
    </section>
  )
}

export async function CourseHighlights() {
  const fetched = await getHomeCourses()
  const courses = fetched.length > 0 ? fetched : FALLBACK
  return (
    <>
      <CourseDeck courses={courses} />
      <MobileCourseList courses={courses} />
    </>
  )
}
