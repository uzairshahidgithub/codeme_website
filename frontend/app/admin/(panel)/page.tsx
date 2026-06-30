import Link from 'next/link'
import { UserGrowthChart, RoleDonutChart } from '@/components/admin/AdminCharts'
import { loadAdminDashboardData } from '@/lib/admin/dashboard-data'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const cardStyle = {
  background: 'var(--card-glass)',
  border: '1px solid var(--border)',
  borderRadius: 22,
  padding: 24,
} as const

function StatCard({ value, label, sub, accent }: { value: number | string; label: string; sub?: React.ReactNode; accent?: 'danger' | 'default' }) {
  return (
    <div style={cardStyle} className="flex flex-col gap-2">
      <div style={{ fontSize: 48, fontWeight: 700, color: accent === 'danger' ? '#ff5c5c' : 'var(--blue)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      <div className="text-text-muted" style={{ fontSize: 14 }}>{label}</div>
      {sub && <div className="text-text-tertiary" style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  )
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function shortId(id: string | null): string {
  if (!id) return '—'
  return id.slice(0, 8)
}

export default async function AdminDashboardPage() {
  const { stats, growth, roles, audit, error } = await loadAdminDashboardData()

  const pendingReview = (stats?.pending_testimonials ?? 0) + (stats?.draft_articles ?? 0)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <span className="home-mono-eyebrow">Admin Dashboard</span>
        <h1 className="text-text-primary" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em' }}>Overview</h1>
      </header>

      {error && (
        <div className="text-text-error" style={{ fontSize: 14, padding: 16, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}>
          Dashboard data unavailable: {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={stats?.total_users ?? 0}
          label="Total Users"
          sub={<span>+{stats?.new_users_week ?? 0} this week</span>}
        />
        <StatCard
          value={stats?.active_today ?? 0}
          label="Active Today"
          sub="Signed in last 24 hours"
        />
        <StatCard
          value={stats?.active_events ?? 0}
          label="Published Events"
          sub={<Link href="/admin/events" className="text-text-link hover:text-text-primary transition-colors">View all →</Link>}
        />
        <StatCard
          value={pendingReview}
          label="Pending Review"
          sub={pendingReview > 0 ? <span style={{ color: '#ff5c5c' }}>Needs attention</span> : 'All clear'}
          accent={pendingReview > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div style={cardStyle} className="lg:col-span-3 flex flex-col gap-3">
          <h2 className="text-text-primary" style={{ fontSize: 16, fontWeight: 600 }}>User Growth — Last 30 Days</h2>
          <UserGrowthChart data={growth} />
        </div>
        <div style={cardStyle} className="lg:col-span-2 flex flex-col gap-3">
          <h2 className="text-text-primary" style={{ fontSize: 16, fontWeight: 600 }}>Role Distribution</h2>
          {roles.length > 0 ? <RoleDonutChart data={roles} /> : <p className="text-text-tertiary" style={{ fontSize: 13 }}>No role data.</p>}
        </div>
      </div>

      {/* Recent audit */}
      <div style={cardStyle} className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <h2 className="text-text-primary" style={{ fontSize: 16, fontWeight: 600 }}>Recent Activity</h2>
          <Link href="/admin/audit-log" className="text-text-link hover:text-text-primary transition-colors" style={{ fontSize: 13 }}>
            View Full Audit Log →
          </Link>
        </div>
        {audit.length === 0 ? (
          <p className="text-text-tertiary" style={{ fontSize: 13 }}>No audit entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr className="text-text-tertiary" style={{ textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>Timestamp</th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>Actor</th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>Action</th>
                  <th style={{ padding: '8px 12px', fontWeight: 500 }}>Target</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((e, i) => (
                  <tr
                    key={e.id}
                    style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                    className="text-text-secondary"
                  >
                    <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>{fmtTime(e.created_at)}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>{shortId(e.user_id)}</td>
                    <td style={{ padding: '10px 12px' }}>{e.action}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}>
                      {(e.metadata && typeof e.metadata === 'object' && 'target_user_id' in e.metadata
                        ? shortId(String(e.metadata['target_user_id']))
                        : e.metadata && 'event_id' in e.metadata
                          ? shortId(String(e.metadata['event_id']))
                          : e.metadata && 'testimonial_id' in e.metadata
                            ? shortId(String(e.metadata['testimonial_id']))
                            : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 rounded-full"
          style={{ padding: '12px 22px', background: 'var(--blue)', color: '#fff', fontSize: 14, fontWeight: 500, boxShadow: '0 8px 28px rgba(26,72,254,0.3)' }}
        >
          Create Event
        </Link>
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2 rounded-full"
          style={{ padding: '12px 22px', background: 'transparent', color: 'var(--text1)', fontSize: 14, fontWeight: 500, border: '1px solid var(--border)' }}
        >
          Publish Course
        </Link>
        <Link
          href="/admin/home"
          className="inline-flex items-center gap-2 rounded-full"
          style={{ padding: '12px 22px', background: 'transparent', color: 'var(--text1)', fontSize: 14, fontWeight: 500, border: '1px solid var(--border)' }}
        >
          Customize Home
        </Link>
      </div>
    </div>
  )
}
