import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { requireAdminPage } from '@/lib/admin/auth'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  // Force dynamic rendering so the role gate runs on every request.
  await headers()

  // Server-side gate: redirects to /admin/auth (or MFA setup/verify) if the
  // session lacks an admin/super_admin claim or has no verified TOTP factor.
  const ctx = await requireAdminPage()

  return (
    <AdminShell
      user={{
        firstName: ctx.firstName,
        avatarUrl: ctx.avatarUrl,
        email: ctx.email,
        role: ctx.role,
      }}
    >
      {children}
    </AdminShell>
  )
}
