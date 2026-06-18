import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AdminUserRow {
  id: string
  email: string
  username: string
  first_name: string
  role: string
  status: string | null
  created_at: string
  last_sign_in_at: string | null
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

export async function loadAdminUsers(): Promise<{ users: AdminUserRow[]; error: string | null }> {
  try {
    const supabase = createAdminClient()

    const [authUsers, profilesRes] = await Promise.all([
      listAllAuthUsers(),
      supabase
        .from('profiles')
        .select('id, username, first_name, role, status, created_at')
        .order('created_at', { ascending: false }),
    ])

    if (profilesRes.error) {
      return { users: [], error: profilesRes.error.message }
    }

    const profilesById = Object.fromEntries((profilesRes.data ?? []).map((p) => [p.id, p]))
    const authById = Object.fromEntries(authUsers.map((u) => [u.id, u]))

    const ids = new Set([...Object.keys(profilesById), ...authUsers.map((u) => u.id)])

    const users: AdminUserRow[] = Array.from(ids).map((id) => {
      const profile = profilesById[id]
      const auth = authById[id]
      return {
        id,
        email: auth?.email ?? '—',
        username: profile?.username ?? (auth?.user_metadata as { username?: string } | undefined)?.username ?? '—',
        first_name: profile?.first_name ?? (auth?.user_metadata as { first_name?: string } | undefined)?.first_name ?? '',
        role: profile?.role ?? 'member',
        status: profile?.status ?? null,
        created_at: profile?.created_at ?? auth?.created_at ?? '',
        last_sign_in_at: auth?.last_sign_in_at ?? null,
      }
    })

    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return { users, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load users'
    return { users: [], error: message }
  }
}
