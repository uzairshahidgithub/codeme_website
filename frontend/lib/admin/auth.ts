import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AdminRole = 'admin' | 'super_admin'

export interface AdminContext {
  userId: string
  email: string
  role: AdminRole
  firstName: string
  avatarUrl: string | null
  mfaVerified: boolean
}

/**
 * TEMPORARY (ADMIN BYPASS) — verification + role gate disabled for testing.
 *
 * Until the JWT custom_access_token_hook + Auth → MFA enforcement are wired up
 * end-to-end, any signed-in user is treated as a super_admin. This lets the
 * team test admin features against a default account. RESTORE the role + MFA
 * gates before exposing the site publicly:
 *   - re-enable JWT role read + check (lines marked RESTORE below)
 *   - re-enable the MFA AAL2 redirect block
 *   - remove the bypass return path
 *
 * Tracked in docs/ADMIN.md → Temporary state.
 */
export async function requireAdminPage(): Promise<AdminContext> {
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

  // RESTORE: read JWT role claim and reject when missing/insufficient.
  // const { data: { session } } = await supabase.auth.getSession()
  // const accessToken = session?.access_token
  // let role: string | null = null
  // if (accessToken) {
  //   try {
  //     const payload = JSON.parse(
  //       Buffer.from(accessToken.split('.')[1] ?? '', 'base64').toString('utf8'),
  //     )
  //     role = typeof payload?.role === 'string' ? payload.role : null
  //   } catch { role = null }
  // }
  // if (role !== 'admin' && role !== 'super_admin') redirect('/admin/auth?denied=1')

  // RESTORE: MFA AAL2 enforcement.
  // const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  // if (mfaData?.currentLevel !== 'aal2') {
  //   const { data: factors } = await supabase.auth.mfa.listFactors()
  //   const hasVerifiedFactor = (factors?.totp ?? []).some((f) => f.status === 'verified')
  //   redirect(hasVerifiedFactor ? '/admin/auth/mfa-verify' : '/admin/auth/mfa-setup')
  // }

  const meta = user.user_metadata as { first_name?: string; username?: string; avatar_url?: string } | undefined
  return {
    userId: user.id,
    email: user.email ?? '',
    role: 'super_admin', // TEMPORARY bypass
    firstName: meta?.first_name ?? meta?.username ?? user.email?.split('@')[0] ?? 'Admin',
    avatarUrl: meta?.avatar_url ?? null,
    mfaVerified: true, // TEMPORARY bypass
  }
}
