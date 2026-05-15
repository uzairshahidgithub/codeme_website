import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Settings — Codemo' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <div className="w-full max-w-[520px] mx-auto flex flex-col gap-4 pb-10">
      <div className="glass-card rounded-[22px] overflow-hidden">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-text-primary" style={{ fontSize: 16, fontWeight: 600 }}>Settings</h2>
        </div>

        {/* Security section */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-text-tertiary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Security
          </p>
          <Link
            href="/profile/settings/password"
            className="flex items-center gap-4 py-3 text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-tertiary" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="flex-1" style={{ fontSize: 15, fontWeight: 500 }}>Change Password</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {/* Account section */}
        <div className="px-5 py-3">
          <p className="text-text-tertiary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Account
          </p>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-text-secondary" style={{ fontSize: 14 }}>Email address</p>
              <p className="text-text-tertiary mt-0.5" style={{ fontSize: 12 }}>{user.email}</p>
            </div>
            <span
              className="glass-chip text-text-tertiary"
              style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8 }}
              title="Email address cannot be changed"
            >
              Locked
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
