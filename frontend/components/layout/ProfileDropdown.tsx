'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProfileDropdownUser {
  firstName: string
  lastName?: string | null
  avatarUrl?: string | null
  title?: string | null
  level?: number | null
}

interface ProfileDropdownProps {
  user: ProfileDropdownUser
  onClose: () => void
  onEditProfile?: () => void
  onSettings?: () => void
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function ProfileDropdown({ user, onClose, onEditProfile, onSettings }: ProfileDropdownProps) {
  const router = useRouter()

  function navigate(path: string) {
    onClose()
    router.push(path)
  }

  function handleEditProfile() {
    onClose()
    if (onEditProfile) {
      onEditProfile()
    } else {
      router.push('/profile/edit')
    }
  }

  function handleSettings() {
    onClose()
    if (onSettings) {
      onSettings()
    } else {
      router.push('/profile/settings')
    }
  }

  async function handleLogout() {
    onClose()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return (
    <div
      className="absolute top-[calc(100%+10px)] right-0 w-[300px] glass-card rounded-[22px] p-[26px] animate-drop-down dropdown-animation z-50"
      role="dialog"
      aria-label="Profile menu"
    >
      {/* Avatar + name header */}
      <div className="flex items-center gap-[16px] mb-[20px]">
        <div
          className="w-[58px] h-[58px] rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            background: 'var(--input-glass)',
            border: '2.5px solid var(--blue)',
            boxShadow: '0 0 0 4px var(--blue-glow)',
          }}
        >
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={fullName}
              width={58}
              height={58}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-text-primary font-semibold" style={{ fontSize: 22 }}>
              {user.firstName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-text-primary truncate" style={{ fontSize: '16px', fontWeight: 600 }}>
            {fullName}
          </p>
          {user.title && (
            <p className="text-text-secondary mt-[3px] truncate" style={{ fontSize: '13px' }}>
              {user.title}
            </p>
          )}
          <span
            className="inline-block mt-[7px] glass-chip text-text-secondary"
            style={{ fontSize: '11px', padding: '3px 12px', borderRadius: '14px', fontWeight: 500 }}
          >
            Community Member
          </span>
        </div>
      </div>

      {/* Action rows */}
      <div className="flex flex-col" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <button
          onClick={() => navigate('/profile/achievements')}
          className="w-full flex items-center gap-[14px] p-[11px_8px] rounded-[12px] text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ fontSize: '15px' }}
        >
          <img
            src="/icons/Achievements (Default).svg"
            alt=""
            width={20}
            height={20}
            className="shrink-0 icon-idle-filter"
          />
          <span className="flex-1 text-left">Achievements</span>
          <span className="text-text-tertiary" style={{ fontSize: '12px' }}>
            Level {user.level ?? 1}
          </span>
        </button>

        <button
          onClick={handleEditProfile}
          className="w-full flex items-center gap-[14px] p-[11px_8px] rounded-[12px] text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ fontSize: '15px' }}
        >
          <img
            src="/icons/Edit Profile (Default).svg"
            alt=""
            width={20}
            height={20}
            className="shrink-0 icon-idle-filter"
          />
          <span className="text-left">Edit Profile</span>
        </button>

        <button
          onClick={handleSettings}
          className="w-full flex items-center gap-[14px] p-[11px_8px] rounded-[12px] text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ fontSize: '15px' }}
        >
          <span className="shrink-0 text-text-tertiary"><SettingsIcon /></span>
          <span className="text-left">Settings</span>
        </button>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 4 }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-[14px] p-[11px_8px] rounded-[12px] hover:bg-white/[0.04] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-error"
            style={{ fontSize: '15px', color: '#ff5c5c' }}
          >
            <span className="shrink-0"><LogoutIcon /></span>
            <span className="text-left">Log out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
