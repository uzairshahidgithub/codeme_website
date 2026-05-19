'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, LogOut, Settings as SettingsIcon, UserPen } from 'lucide-react'
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
  /** External trigger element to anchor against. */
  anchorRef: React.RefObject<HTMLElement | null>
}

/* ────────────────────────────────────────────────────────────
   ProfileDropdown — portal-rendered popup anchored under the
   avatar trigger.

   Why portal: the navbar pill has `overflow: visible` but the
   absolute popup was previously trapped inside the pill's
   stacking context, leaving it visually clipped behind nearby
   content. Rendering into <body> with fixed coordinates means
   the popup floats above EVERYTHING (cards, modals, sidebar)
   and is always fully visible.

   Icons: lucide-react (Award, UserPen, Settings, LogOut)
   wrapped in macOS-style filled squircles to match the rest
   of the home page language.
   ────────────────────────────────────────────────────────── */

interface ActionRowProps {
  icon: ReactNode
  label: string
  trailing?: ReactNode
  onClick: () => void
  destructive?: boolean
}

/* Minimal action row — just a line icon and a label.
   No coloured squircle, no fill backgrounds. The icon
   inherits text colour, so it shifts with the row's
   hover state. Destructive row paints the icon red. */
function ActionRow({ icon, label, trailing, onClick, destructive }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px]
        text-text-secondary hover:text-text-primary
        hover:bg-text-primary/[0.05]
        transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
        ${destructive ? 'hover:text-[#ff5c5c]' : ''}
      `}
    >
      <span
        className={`shrink-0 ${destructive ? 'text-[#ff5c5c]' : 'text-text-tertiary group-hover:text-text-primary'} transition-colors`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className={`flex-1 text-left text-[14px] font-medium ${destructive ? 'text-[#ff5c5c]' : ''}`}>
        {label}
      </span>
      {trailing && (
        <span className="text-text-tertiary text-[11px] tabular-nums">{trailing}</span>
      )}
    </button>
  )
}

export function ProfileDropdown({
  user,
  onClose,
  onEditProfile,
  onSettings,
  anchorRef,
}: ProfileDropdownProps) {
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Anchor under the trigger's bottom-right corner. Right-aligned
  // and clamped to the viewport so the popup never pokes off-screen.
  useLayoutEffect(() => {
    function place() {
      const el = anchorRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const right = Math.max(10, window.innerWidth - r.right)
      const top = r.bottom + 10
      setPos({ top, right })
    }
    place()
    window.addEventListener('scroll', place, { passive: true, capture: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', place)
    }
  }, [anchorRef])

  // Outside click + ESC close
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (anchorRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      onClose()
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [anchorRef, onClose])

  function navigate(path: string) {
    onClose()
    router.push(path)
  }
  function handleEditProfile() {
    onClose()
    if (onEditProfile) onEditProfile()
    else router.push('/profile/edit')
  }
  function handleSettings() {
    onClose()
    if (onSettings) onSettings()
    else router.push('/profile/settings')
  }
  async function handleLogout() {
    onClose()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {pos && (
        <motion.div
          ref={menuRef}
          role="dialog"
          aria-label="Profile menu"
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 500 }}
          className="w-[300px] glass-card rounded-[22px] p-5"
        >
          {/* Avatar + name header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: 'var(--input-glass)',
                border: '2px solid var(--blue)',
                boxShadow: '0 0 0 3px var(--blue-glow)',
              }}
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={fullName}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-text-primary font-semibold text-[18px]">
                  {user.firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-text-primary truncate text-[15px] font-semibold">{fullName}</p>
              {user.title && (
                <p className="text-text-secondary mt-0.5 truncate text-[12px]">{user.title}</p>
              )}
              <span
                className="inline-block mt-1.5 text-text-secondary text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
              >
                Community Member
              </span>
            </div>
          </div>

          {/* Action rows */}
          <div
            className="flex flex-col gap-1 pt-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <ActionRow
              icon={<Award size={18} strokeWidth={1.6} />}
              label="Achievements"
              trailing={`Level ${user.level ?? 1}`}
              onClick={() => navigate('/profile/achievements')}
            />
            <ActionRow
              icon={<UserPen size={18} strokeWidth={1.6} />}
              label="Edit Profile"
              onClick={handleEditProfile}
            />
            <ActionRow
              icon={<SettingsIcon size={18} strokeWidth={1.6} />}
              label="Settings"
              onClick={handleSettings}
            />

            <div className="my-1.5" style={{ borderTop: '1px solid var(--border)' }} />

            <ActionRow
              icon={<LogOut size={18} strokeWidth={1.6} />}
              label="Log out"
              destructive
              onClick={handleLogout}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
