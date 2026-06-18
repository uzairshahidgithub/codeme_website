import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole, type AdminRole } from '@/lib/admin/roles'

export type { AdminRole } from '@/lib/admin/roles'
export { isAdminRole } from '@/lib/admin/roles'

export interface AdminContext {
  userId: string
  email: string
  role: AdminRole
  firstName: string
  avatarUrl: string | null
  mfaVerified: boolean
}

/** Reads profiles.role for the signed-in user (source of truth when JWT hook is off). */
export async function getProfileForUser(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('role, first_name, username, avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[admin] profile lookup failed:', error.message)
    return null
  }
  return data
}

/**
 * Server gate for all /admin/(panel) routes.
 * Only users with profiles.role = admin | super_admin may proceed.
 */
export const requireAdminPage = cache(async function requireAdminPage(): Promise<AdminContext> {
  const supabase = await createClient()

  let user
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }

  if (!user) {
    redirect('/admin/auth')
  }

  const profile = await getProfileForUser(user.id)

  if (!profile || !isAdminRole(profile.role)) {
    redirect('/admin/auth?denied=1')
  }

  const meta = user.user_metadata as { first_name?: string; username?: string; avatar_url?: string } | undefined

  return {
    userId: user.id,
    email: user.email ?? '',
    role: profile.role,
    firstName: profile.first_name || meta?.first_name || profile.username || user.email?.split('@')[0] || 'Admin',
    avatarUrl: profile.avatar_url ?? meta?.avatar_url ?? null,
    mfaVerified: true,
  }
})
