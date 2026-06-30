export type ProfileRole = 'member' | 'moderator' | 'dev' | 'admin' | 'super_admin'

export type AdminRole = 'admin' | 'super_admin'

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === 'admin' || role === 'super_admin'
}

export function canAccessDevTools(role: string | null | undefined): boolean {
  return role === 'dev' || role === 'admin' || role === 'super_admin'
}

export const ASSIGNABLE_ROLES = ['member', 'dev', 'admin', 'super_admin'] as const
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]
