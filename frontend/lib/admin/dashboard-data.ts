import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import type { GrowthPoint, RolePoint } from '@/components/admin/AdminCharts'

export interface AdminStats {
  total_users: number
  new_users_week: number
  new_users_month: number
  active_today: number
  active_events: number
  active_courses: number
  pending_testimonials: number
  draft_articles: number
}

export interface AuditEntry {
  id: string
  user_id: string | null
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
}

async function listAllAuthUsers(): Promise<User[]> {
  const supabase = createAdminClient()
  const all: User[] = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    all.push(...data.users)
    if (data.users.length < perPage) break
    page += 1
  }

  return all
}

function buildGrowthSeries(
  users: Array<{ created_at: string }>,
): GrowthPoint[] {
  const counts = new Map<string, number>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    counts.set(key, 0)
  }

  for (const user of users) {
    if (!user.created_at) continue
    const key = user.created_at.slice(0, 10)
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries()).map(([day, signups]) => ({
    day: day.slice(5),
    signups,
  }))
}

export async function loadAdminDashboardData(): Promise<{
  stats: AdminStats | null
  growth: GrowthPoint[]
  roles: RolePoint[]
  audit: AuditEntry[]
  error: string | null
}> {
  try {
    const supabase = createAdminClient()
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000
    const dayAgo = now - 24 * 60 * 60 * 1000

    const [
      authUsers,
      profilesRes,
      eventsRes,
      coursesRes,
      testimonialsRes,
      articlesRes,
      auditRes,
    ] = await Promise.all([
      listAllAuthUsers(),
      supabase.from('profiles').select('role'),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('approved', false),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      supabase.from('audit_log').select('id, user_id, action, metadata, created_at').order('created_at', { ascending: false }).limit(10),
    ])

    const stats: AdminStats = {
      total_users: authUsers.length,
      new_users_week: authUsers.filter((u) => new Date(u.created_at).getTime() > weekAgo).length,
      new_users_month: authUsers.filter((u) => new Date(u.created_at).getTime() > monthAgo).length,
      active_today: authUsers.filter((u) => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() > dayAgo).length,
      active_events: eventsRes.count ?? 0,
      active_courses: coursesRes.count ?? 0,
      pending_testimonials: testimonialsRes.count ?? 0,
      draft_articles: articlesRes.count ?? 0,
    }

    const roleMap = new Map<string, number>()
    for (const row of profilesRes.data ?? []) {
      roleMap.set(row.role, (roleMap.get(row.role) ?? 0) + 1)
    }

    const roles: RolePoint[] = Array.from(roleMap.entries())
      .map(([role, total]) => ({ role, total }))
      .sort((a, b) => b.total - a.total)

    return {
      stats,
      growth: buildGrowthSeries(authUsers),
      roles,
      audit: (auditRes.data ?? []) as AuditEntry[],
      error: null,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load dashboard'
    return { stats: null, growth: [], roles: [], audit: [], error: message }
  }
}
