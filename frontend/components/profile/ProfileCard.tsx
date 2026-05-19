'use client'

import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  Award,
  AtSign,
  Briefcase,
  Cake,
  ChevronRight,
  LogOut,
  Mail,
  Settings as SettingsIcon,
  Sparkles,
  UserPen,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EditProfileDrawer } from '@/components/profile/EditProfileDrawer'
import { SettingsDrawer } from '@/components/profile/SettingsDrawer'

/* ────────────────────────────────────────────────────────────
   ProfileCard — single component, drives both mobile and
   desktop renders.

   Mobile design language matches the home page's chrome:
     · Glass-card surfaces with the Codemo radius (22px)
     · Lucide icons — same family the navbar's ProfileDropdown
       and SettingsDrawer use, so the language carries across
     · Softer shadows than the global glass-card defaults
       (the brief asked for low shadows)
     · Edit/Settings open as drawers in-place rather than
       routing to /profile/edit and /profile/settings — same
       behaviour as the navbar dropdown
     · Bottom padding reserves room for the mobile dock so
       the last row is never tucked behind it
   ────────────────────────────────────────────────────────── */

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

/* Softer shadow than the default .glass-card — applied
   inline so the rest of the site's glass surfaces aren't
   touched. The brief: "shadows make low". */
const SOFT_SHADOW =
  '0 1px 0 var(--inner-hi) inset, 0 6px 18px -14px rgba(0,0,0,0.18), 0 2px 6px -4px rgba(0,0,0,0.08)'

/* ─── Atoms ──────────────────────────────────────────────── */

function DetailRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: ReactNode
  label: string
  value: string
  isLast?: boolean
}) {
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={isLast ? undefined : { borderBottom: '1px solid var(--border)' }}
    >
      <span className="shrink-0 text-text-tertiary" aria-hidden="true">
        {icon}
      </span>
      <span
        className="text-text-tertiary shrink-0"
        style={{ fontSize: 12.5, minWidth: 78 }}
      >
        {label}
      </span>
      <span
        className="flex-1 text-text-primary text-right truncate"
        style={{ fontSize: 14, fontWeight: 500 }}
      >
        {value}
      </span>
    </div>
  )
}

interface ActionRowProps {
  icon: ReactNode
  label: string
  trail?: string
  onClick: () => void
  destructive?: boolean
  isLast?: boolean
}

function ActionRow({ icon, label, trail, onClick, destructive, isLast }: ActionRowProps) {
  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-3 px-4 py-3.5 text-left
        transition-colors duration-150 active:bg-text-primary/[0.06]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
        ${destructive ? '' : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/[0.04]'}
      `}
      style={{
        ...(isLast ? {} : { borderBottom: '1px solid var(--border)' }),
        ...(destructive ? { color: '#ff5c5c' } : {}),
      }}
    >
      <span
        className="shrink-0"
        style={{
          color: destructive ? '#ff5c5c' : 'var(--text3)',
        }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span
        className="flex-1"
        style={{ fontSize: 14.5, fontWeight: 500 }}
      >
        {label}
      </span>
      {trail && (
        <span className="text-text-tertiary tabular-nums" style={{ fontSize: 12 }}>
          {trail}
        </span>
      )}
      {!destructive && (
        <ChevronRight
          size={16}
          strokeWidth={1.8}
          className="text-text-tertiary shrink-0"
          aria-hidden
        />
      )}
    </button>
  )
}

/* ─── Component ──────────────────────────────────────────── */

export function ProfileCard({ user }: { user: ProfileUser }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  const initials = user.firstName.charAt(0).toUpperCase()

  const detailRows: { icon: ReactNode; label: string; value: string | null }[] = [
    { icon: <Mail size={16} strokeWidth={1.7} />, label: 'Email', value: user.email },
    { icon: <Briefcase size={16} strokeWidth={1.7} />, label: 'Domain', value: user.domain },
    { icon: <Sparkles size={16} strokeWidth={1.7} />, label: 'Status', value: user.status },
    { icon: <Users size={16} strokeWidth={1.7} />, label: 'Gender', value: user.gender },
    { icon: <Cake size={16} strokeWidth={1.7} />, label: 'Date of Birth', value: formatDob(user.dob) },
  ]
  const visibleRows = detailRows.filter((r) => !!r.value) as {
    icon: ReactNode
    label: string
    value: string
  }[]

  return (
    <>
      <div className="w-full max-w-[520px] mx-auto flex flex-col gap-4 px-3 sm:px-0 pt-2 pb-[calc(var(--mob-dock-height,64px)+var(--mob-dock-bottom,14px)+20px)] md:pb-0">
        {/* ── Hero card: avatar + identity ────────────── */}
        <div
          className="rounded-[22px] p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left"
          style={{
            background: 'var(--card-glass)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)',
            boxShadow: SOFT_SHADOW,
          }}
        >
          {/* Avatar with soft blue ring (matches onboarding) */}
          <div
            className="shrink-0 rounded-full overflow-hidden flex items-center justify-center"
            style={{
              width: 88,
              height: 88,
              border: '2px solid var(--blue)',
              boxShadow: '0 0 0 4px var(--blue-glow)',
              background: 'var(--input-glass)',
            }}
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.firstName}
                width={88}
                height={88}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <span
                className="text-text-primary"
                style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.02em' }}
              >
                {initials}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start">
            {/* Display name — extralight, large, Poppins via inherited font-sans */}
            <p
              className="text-text-primary truncate w-full"
              style={{
                fontSize: 22,
                fontWeight: 300,
                letterSpacing: '-0.025em',
                lineHeight: 1.15,
              }}
            >
              {user.firstName}
            </p>

            {user.username && (
              <p
                className="mt-1 inline-flex items-center gap-1 text-text-tertiary truncate"
                style={{ fontSize: 12.5 }}
              >
                <AtSign size={12} strokeWidth={1.7} aria-hidden />
                {user.username}
              </p>
            )}

            <span
              className="inline-block mt-3 text-text-secondary"
              style={{
                fontSize: 10.5,
                padding: '4px 11px',
                borderRadius: 999,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'color-mix(in oklab, var(--text1) 6%, transparent)',
                border: '1px solid var(--border)',
              }}
            >
              Community Member · Lvl 1
            </span>
          </div>
        </div>

        {/* ── Details card ──────────────────────────────── */}
        {visibleRows.length > 0 && (
          <div
            className="rounded-[22px] px-5 py-4"
            style={{
              background: 'var(--card-glass)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(14px) saturate(160%)',
              WebkitBackdropFilter: 'blur(14px) saturate(160%)',
              boxShadow: SOFT_SHADOW,
            }}
          >
            <p
              className="text-text-tertiary mb-1"
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              Profile
            </p>
            <div>
              {visibleRows.map((r, i) => (
                <DetailRow
                  key={r.label}
                  icon={r.icon}
                  label={r.label}
                  value={r.value}
                  isLast={i === visibleRows.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Actions card ──────────────────────────────── */}
        <div
          className="rounded-[22px] overflow-hidden"
          style={{
            background: 'var(--card-glass)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)',
            boxShadow: SOFT_SHADOW,
          }}
        >
          <ActionRow
            icon={<Award size={18} strokeWidth={1.6} />}
            label="Achievements"
            trail="Lvl 1"
            onClick={() => router.push('/profile/achievements')}
          />
          <ActionRow
            icon={<UserPen size={18} strokeWidth={1.6} />}
            label="Edit Profile"
            onClick={() => setEditOpen(true)}
          />
          <ActionRow
            icon={<SettingsIcon size={18} strokeWidth={1.6} />}
            label="Settings"
            onClick={() => setSettingsOpen(true)}
          />
        </div>

        {/* ── Log out ───────────────────────────────────── */}
        <div
          className="rounded-[22px] overflow-hidden"
          style={{
            background: 'var(--card-glass)',
            border: '1px solid var(--border)',
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)',
            boxShadow: SOFT_SHADOW,
          }}
        >
          <ActionRow
            icon={<LogOut size={18} strokeWidth={1.6} />}
            label="Log out"
            destructive
            onClick={handleLogout}
            isLast
          />
        </div>
      </div>

      {/* Drawers — portal to document.body via Drawer primitive */}
      <EditProfileDrawer open={editOpen} onClose={() => setEditOpen(false)} />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onEditProfile={() => {
          setSettingsOpen(false)
          setEditOpen(true)
        }}
      />
    </>
  )
}
