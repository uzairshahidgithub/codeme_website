export const ADMIN_VERIFY_EMAIL_KEY = 'codemo.admin.verify.email'
export const ADMIN_CREDS_OK_KEY = 'codemo.admin.creds.ok'

export function readAdminCredsGate(email: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = sessionStorage.getItem(ADMIN_CREDS_OK_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { email?: string; exp?: number }
    return parsed.email === email && typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}
