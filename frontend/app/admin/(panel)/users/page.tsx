import { requireAdminPage } from '@/lib/admin/auth'
import { loadAdminUsers } from '@/lib/admin/users-data'
import { UserRoleSelect } from '@/components/admin/UserRoleSelect'

export const dynamic = 'force-dynamic'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default async function AdminUsersPage() {
  const ctx = await requireAdminPage()
  const { users, error } = await loadAdminUsers()
  const canEditRoles = ctx.role === 'super_admin'

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="home-mono-eyebrow">admin · users</span>
        <h1 className="text-text-primary" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em' }}>
          User Management
        </h1>
        <p className="text-text-tertiary" style={{ fontSize: 14 }}>
          {users.length} registered {users.length === 1 ? 'user' : 'users'}.
          {!canEditRoles && ' Role changes require super_admin.'}
        </p>
      </header>

      {error && (
        <div
          className="text-text-error rounded-xl"
          style={{ padding: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 14 }}
        >
          Failed to load users: {error}
          {!process.env.SUPABASE_SERVICE_ROLE_KEY && (
            <p className="mt-2 text-text-secondary" style={{ fontSize: 13 }}>
              Set <code>SUPABASE_SERVICE_ROLE_KEY</code> in your environment to enable admin user listing.
            </p>
          )}
        </div>
      )}

      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 140px',
            background: 'var(--bg-surface)',
            padding: '16px 24px',
            gap: 12,
          }}
        >
          <Cell>User</Cell>
          <Cell>Email</Cell>
          <Cell>Status</Cell>
          <Cell>Joined</Cell>
          <Cell>Last sign-in</Cell>
          <Cell>Role</Cell>
        </div>

        {users.map((user, i) => (
          <div
            key={user.id}
            className="grid items-center"
            style={{
              gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 140px',
              padding: '14px 24px',
              gap: 12,
              borderTop: '1px solid var(--border)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
            }}
          >
            <div className="min-w-0">
              <div className="text-text-primary truncate" style={{ fontSize: 15, fontWeight: 600 }}>
                {user.first_name || user.username}
              </div>
              <div className="text-text-muted truncate" style={{ fontSize: 12, fontFamily: 'ui-monospace, Menlo, monospace' }}>
                @{user.username}
              </div>
            </div>
            <div className="text-text-secondary truncate" style={{ fontSize: 13 }}>{user.email}</div>
            <div className="text-text-secondary capitalize" style={{ fontSize: 13 }}>{user.status ?? '—'}</div>
            <div className="text-text-secondary" style={{ fontSize: 13 }}>{fmtDate(user.created_at)}</div>
            <div className="text-text-secondary" style={{ fontSize: 13 }}>{fmtDate(user.last_sign_in_at)}</div>
            <UserRoleSelect
              userId={user.id}
              currentRole={user.role}
              disabled={!canEditRoles || user.id === ctx.userId}
            />
          </div>
        ))}

        {users.length === 0 && !error && (
          <div className="text-text-tertiary text-center" style={{ padding: 32, fontSize: 14, borderTop: '1px solid var(--border)' }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-text-muted" style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}
