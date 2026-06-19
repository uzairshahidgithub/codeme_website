import { createPublicClient } from '@/lib/supabase/public'
import type { CourseItem } from '@/components/home/CourseHighlights'

export interface PublicCourseRow {
  id: string
  title: string
  description: string
  short_description: string | null
  thumbnail_url: string | null
  level: 'beginner' | 'intermediate' | 'advanced'
  instructor_name: string
  duration_hours: number
  duration_label: string | null
  enrolled_count: number
  category: string | null
  tags: string[] | null
  status: string
  is_featured: boolean
  featured_label: string | null
  featured_sort_order: number
  price: number
  original_price: number | null
  rating: number
}

export const COURSE_PUBLIC_SELECT =
  'id, title, description, short_description, thumbnail_url, level, instructor_name, duration_hours, duration_label, enrolled_count, category, tags, status, is_featured, featured_label, featured_sort_order, price, original_price, rating'

export async function fetchPublishedCourses(): Promise<PublicCourseRow[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('courses')
    .select(COURSE_PUBLIC_SELECT)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('featured_sort_order', { ascending: true })
    .order('enrolled_count', { ascending: false })

  if (error) {
    console.warn('[courses] fetch failed:', error.message)
    return []
  }
  return (data ?? []) as PublicCourseRow[]
}

export async function fetchFeaturedCourses(limit = 6): Promise<CourseItem[]> {
  const rows = await fetchPublishedCourses()
  const featured = rows.filter((r) => r.is_featured)
  const rest = rows.filter((r) => !r.is_featured)
  const ordered = [...featured, ...rest].slice(0, limit)
  return ordered.map(toHomeCourseItem)
}

export function toHomeCourseItem(row: PublicCourseRow): CourseItem {
  return {
    id: row.id,
    title: row.title,
    level: row.level,
    instructor_name: row.instructor_name,
    duration_hours: row.duration_hours,
    enrolled_count: row.enrolled_count,
    thumbnail_url: row.thumbnail_url,
    tags: row.tags,
    description: row.short_description || row.description,
  }
}

/** Shape used by the Eduto page client component. */
export interface EdutoCourse {
  id: string
  title: string
  category: string
  duration: string
  origPrice: number | null
  price: number
  rating: string
  mentor: string
  feature?: string
  level: string
  description: string
  shortDescription: string
  image: string
}

export function toEdutoCourse(row: PublicCourseRow): EdutoCourse {
  const levelLabel =
    row.level === 'beginner' ? 'Beginner' :
    row.level === 'advanced' ? 'Advanced' : 'Intermediate'

  return {
    id: row.id,
    title: row.title,
    category: row.category ?? 'General',
    duration: row.duration_label ?? `${row.duration_hours} Hours`,
    origPrice: row.original_price != null ? Number(row.original_price) : null,
    price: Number(row.price) || 0,
    rating: Number(row.rating).toFixed(1),
    mentor: row.instructor_name,
    feature: row.is_featured ? (row.featured_label ?? 'Featured') : undefined,
    level: levelLabel,
    description: row.description,
    shortDescription: row.short_description ?? row.description.slice(0, 120),
    image: row.thumbnail_url ?? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
  }
}

export function edutoCategoriesFromCourses(courses: EdutoCourse[]): string[] {
  const cats = new Set(courses.map((c) => c.category).filter(Boolean))
  return ['All', ...Array.from(cats).sort()]
}
