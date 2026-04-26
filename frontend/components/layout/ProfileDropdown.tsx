'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

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
}

export function ProfileDropdown({ user, onClose }: ProfileDropdownProps) {
  const router = useRouter()

  function navigate(path: string) {
    onClose()
    router.push(path)
  }

  async function handleLogout() {
    onClose()
    await signOut({ callbackUrl: '/' })
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return (
    <div
      className="absolute top-[calc(100%+10px)] right-0 w-[300px] glass-card rounded-[22px] p-[26px] animate-drop-down dropdown-animation z-50"
      role="dialog"
      aria-label="Profile menu"
    >
      <div className="flex items-center gap-[16px] mb-[20px]">
        <div className="w-[58px] h-[58px] rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ background: 'var(--input-glass)', border: '2.5px solid var(--blue)', boxShadow: '0 0 0 4px var(--blue-glow)' }}>
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={fullName}
              width={58}
              height={58}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-h3">
              {user.firstName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p
            className="text-text-primary"
            style={{ fontSize: '16px', fontWeight: 600 }}
          >
            {fullName}
          </p>
          {user.title && (
            <p className="text-text-secondary mt-[3px]" style={{ fontSize: '13px' }}>
              {user.title}
            </p>
          )}
          <span className="inline-block mt-[7px] glass-chip text-text-secondary" style={{ fontSize: '11px', padding: '3px 12px', borderRadius: '14px', fontWeight: 500 }}>
            Community Member
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col space-y-1">
        <button
          onClick={() => navigate('/profile/achievements')}
          className="w-full flex items-center gap-[14px] p-[11px_8px] rounded-[12px] bg-transparent text-text-secondary hover:text-text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ fontSize: '15px' }}
        >
          <img
            src="/icons/Shield (Default).svg"
            alt=""
            width={20}
            height={20}
            className="opacity-70"
            style={{ filter: 'var(--icon-idle)' }}
          />
          <span className="flex-1 text-left">
            Achievements
          </span>
          <span className="text-text-tertiary" style={{ fontSize: '12px', marginLeft: '4px' }}>
            Level {user.level ?? 1}
          </span>
        </button>

        <button
          onClick={() => navigate('/profile/edit')}
          className="w-full flex items-center gap-[14px] p-[11px_8px] rounded-[12px] bg-transparent text-text-secondary hover:text-text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ fontSize: '15px' }}
        >
          <img
            src="/icons/Gear (Default).svg"
            alt=""
            width={20}
            height={20}
            className="opacity-70"
            style={{ filter: 'var(--icon-idle)' }}
          />
          <span className="text-left">
            Edit Profile
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-[14px] p-[11px_8px] rounded-[12px] bg-transparent text-text-error hover:brightness-110 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-error"
          style={{ fontSize: '15px' }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-left">
            Log out
          </span>
        </button>
      </div>
    </div>
  )
}
