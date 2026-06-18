export type AdminRole = 'admin' | 'super_admin'

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === 'admin' || role === 'super_admin'
}
