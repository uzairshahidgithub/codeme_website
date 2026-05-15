'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileUser {
  firstName: string
  username: string
  avatarUrl: string | null
  email: string
  domain: string | null
  status: string | null
  gender: string | null
  dob: string | null
}

function formatDob(dob: string | null) {
  if (!dob) return null
  try {
    return new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch {
    return dob
  }
}

export function ProfileCard({ user }: { user: ProfileUser }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  const initials = user.firstName.charAt(0).toUpperCase()

  return (
    <div className="w-full max-w-[520px] mx-auto px-0 lg:px-0 flex flex-col gap-4">

      {/* Hero card — avatar + name */}
      <div
        className="glass-card rounded-[22px] p-6 flex items-center gap-5"
      >
        <div
          className="shrink-0 rounded-full overflow-hidden flex items-center justify-center"
          style={{
            width: 72,
            height: 72,
            border: '2.5px solid var(--blue)',
            boxShadow: '0 0 0 4px var(--blue-glow)',
            background: 'var(--input-glass)',
          }}
        >
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.firstName}
              width={72}
              height={72}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-text-primary" style={{ fontSize: 28, fontWeight: 600 }}>
              {initials}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-text-primary truncate" style={{ fontSize: 20, fontWeight: 600 }}>
            {user.firstName}
          </p>
          {user.username && (
            <p className="text-text-tertiary mt-0.5 truncate" style={{ fontSize: 13 }}>
              @{user.username}
            </p>
          )}
          <span
            className="inline-block mt-2 glass-chip text-text-secondary"
            style={{ fontSize: 11, padding: '3px 12px', borderRadius: 14, fontWeight: 500 }}
          >
            Community Member · Level 1
          </span>
        </div>
      </div>

      {/* Details card */}
      <div className="glass-card rounded-[22px] p-5 flex flex-col gap-3">
        <p className="text-text-tertiary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Profile Details
        </p>

        {[
          { label: 'Email', value: user.email },
          { label: 'Domain', value: user.domain },
          { label: 'Status', value: user.status },
          { label: 'Gender', value: user.gender },
          { label: 'Date of Birth', value: formatDob(user.dob) },
        ].filter(({ value }) => !!value).map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 py-1.5"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-text-tertiary shrink-0" style={{ fontSize: 13, minWidth: 90 }}>{label}</span>
            <span className="text-text-primary text-right truncate" style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Actions card */}
      <div className="glass-card rounded-[22px] overflow-hidden">
        {[
          {
            href: '/profile/achievements',
            imgSrc: '/icons/Achievements (Default).svg',
            label: 'Achievements',
            trail: 'Level 1',
          },
          {
            href: '/profile/edit',
            imgSrc: '/icons/Edit Profile (Default).svg',
            label: 'Edit Profile',
            trail: null,
          },
          {
            href: '/profile/settings',
            imgSrc: null,
            label: 'Settings',
            trail: null,
          },
        ].map(({ href, imgSrc, label, trail }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-5 py-4 text-text-secondary hover:text-text-primary hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors duration-150"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span className="shrink-0 text-text-tertiary w-5 h-5 flex items-center justify-center">
              {imgSrc ? (
                <img src={imgSrc} alt="" width={20} height={20} className="icon-idle-filter" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              )}
            </span>
            <span className="flex-1" style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
            {trail && (
              <span className="text-text-tertiary" style={{ fontSize: 12 }}>{trail}</span>
            )}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}

        {/* Log out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-white/[0.04] active:bg-white/[0.07]"
          style={{ color: '#ff5c5c' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 500 }}>Log out</span>
        </button>
      </div>
    </div>
  )
}
