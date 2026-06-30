import { createPublicClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'
import { COURSE_PUBLIC_SELECT, toEdutoCourse, type PublicCourseRow } from '@/lib/courses/public'

export interface DonationAccount {
  id: string
  label: string
  account_value: string
  account_name: string
  sort_order: number
}

export const DEFAULT_DONATION_ACCOUNTS: DonationAccount[] = [
  { id: '1', label: 'JazzCash', account_value: '0300 1234567', account_name: 'Codemo Teams', sort_order: 1 },
  { id: '2', label: 'Easypaisa', account_value: '0345 7654321', account_name: 'Codemo Teams', sort_order: 2 },
  { id: '3', label: 'Meezan Bank transfer', account_value: 'PK36 MEZN 0001 2345 6789 1011', account_name: 'Codemo Teams', sort_order: 3 },
]

export async function fetchDonationAccounts(): Promise<DonationAccount[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('donation_accounts')
    .select('id, label, account_value, account_name, sort_order')
    .order('sort_order', { ascending: true })

  if (error || !data?.length) return DEFAULT_DONATION_ACCOUNTS
  return data as DonationAccount[]
}

export async function fetchContactPortraitUrl(): Promise<string | null> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'contact_portrait_url')
    .maybeSingle()

  if (!data?.value) return null
  const raw = data.value
  if (typeof raw === 'object' && raw !== null && 'url' in raw) {
    const url = (raw as { url?: string }).url
    return url?.trim() || null
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { url?: string }
      return parsed.url?.trim() || null
    } catch {
      return null
    }
  }
  return null
}

export async function fetchHomeFeaturedCourseIds(): Promise<string[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('home_featured_courses')
    .select('course_id')
    .order('sort_order', { ascending: true })
  return (data ?? []).map((r) => r.course_id as string)
}

export async function fetchHomeFeaturedEventIds(): Promise<string[]> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('home_featured_events')
    .select('event_id')
    .order('sort_order', { ascending: true })
  return (data ?? []).map((r) => r.event_id as string)
}

/** Homepage deck targets 6–8 cards (admin picks first, then featured, then published). */
export const HOME_COURSE_TARGET = 8
export const HOME_COURSE_MIN = 6

async function fetchPublishedCourseRows(
  supabase: ReturnType<typeof createPublicClient>,
  extra?: { featuredOnly?: boolean; excludeIds?: string[] },
): Promise<PublicCourseRow[]> {
  let query = supabase
    .from('courses')
    .select(COURSE_PUBLIC_SELECT)
    .eq('status', 'published')

  if (extra?.featuredOnly) {
    query = query.eq('is_featured', true).order('featured_sort_order', { ascending: true })
  } else {
    query = query
      .order('is_featured', { ascending: false })
      .order('featured_sort_order', { ascending: true })
      .order('enrolled_count', { ascending: false })
  }

  const { data } = await query.limit(HOME_COURSE_TARGET * 2)
  const rows = (data ?? []) as PublicCourseRow[]
  if (!extra?.excludeIds?.length) return rows
  const exclude = new Set(extra.excludeIds)
  return rows.filter((r) => !exclude.has(r.id))
}

export async function fetchHomeFeaturedCourses(limit = HOME_COURSE_TARGET) {
  const supabase = createPublicClient()
  const minCount = Math.min(HOME_COURSE_MIN, limit)
  const pickedIds = await fetchHomeFeaturedCourseIds()

  const result: PublicCourseRow[] = []
  const seen = new Set<string>()

  const append = (rows: PublicCourseRow[]) => {
    for (const row of rows) {
      if (seen.has(row.id) || result.length >= limit) continue
      seen.add(row.id)
      result.push(row)
    }
  }

  if (pickedIds.length > 0) {
    const { data } = await supabase
      .from('courses')
      .select(COURSE_PUBLIC_SELECT)
      .in('id', pickedIds)
      .eq('status', 'published')

    const byId = new Map(((data ?? []) as PublicCourseRow[]).map((r) => [r.id, r]))
    append(pickedIds.map((id) => byId.get(id)).filter(Boolean) as PublicCourseRow[])
  }

  if (result.length < minCount) {
    append(await fetchPublishedCourseRows(supabase, { featuredOnly: true, excludeIds: [...seen] }))
  }

  if (result.length < minCount) {
    append(await fetchPublishedCourseRows(supabase, { excludeIds: [...seen] }))
  }

  return result.slice(0, limit)
}

export async function fetchHomeFeaturedEvents(limit = 3) {
  const ids = await fetchHomeFeaturedEventIds()
  const supabase = createPublicClient()

  if (ids.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('id, title, description, starts_at, category, max_attendees, banner_url')
      .in('id', ids)
      .eq('status', 'published')

    const rows = data ?? []
    const byId = new Map(rows.map((r) => [r.id, r]))
    return ids.map((id) => byId.get(id)).filter(Boolean).slice(0, limit)
  }

  const { data } = await supabase
    .from('events')
    .select('id, title, description, starts_at, category, max_attendees, banner_url')
    .gte('starts_at', new Date().toISOString())
    .eq('status', 'published')
    .order('starts_at', { ascending: true })
    .limit(limit)

  return data ?? []
}

export async function listHomeAdminData() {
  const db = createAdminClient()
  const [courses, events, accounts, featuredCourses, featuredEvents, portrait, testimonials] = await Promise.all([
    db.from('courses').select('id, title, status').eq('status', 'published').order('title'),
    db.from('events').select('id, title, status, starts_at').eq('status', 'published').order('starts_at', { ascending: false }),
    db.from('donation_accounts').select('*').order('sort_order'),
    db.from('home_featured_courses').select('id, course_id, sort_order').order('sort_order'),
    db.from('home_featured_events').select('id, event_id, sort_order').order('sort_order'),
    db.from('site_content').select('value').eq('key', 'contact_portrait_url').maybeSingle(),
    db.from('testimonials').select('id, name, role, content, approved, rating').order('created_at', { ascending: false }).limit(50),
  ])

  let portraitUrl = ''
  if (portrait.data?.value) {
    const raw = portrait.data.value
    if (typeof raw === 'object' && raw !== null && 'url' in raw) {
      portraitUrl = String((raw as { url?: string }).url ?? '')
    }
  }

  return {
    courses: courses.data ?? [],
    events: events.data ?? [],
    accounts: accounts.data ?? [],
    featuredCourseIds: (featuredCourses.data ?? []).map((r) => r.course_id as string),
    featuredEventIds: (featuredEvents.data ?? []).map((r) => r.event_id as string),
    portraitUrl,
    testimonials: testimonials.data ?? [],
  }
}
