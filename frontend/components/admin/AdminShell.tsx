'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CodemoLogo } from '@/components/ui/CodemoLogo'
import { useThemeStore } from '@/stores/theme'
import type { AdminRole } from '@/lib/admin/roles'
import { cn } from '@/lib/utils'

interface AdminShellProps {
  user: {
    firstName: string
    avatarUrl: string | null
    email: string
    role: AdminRole
  }
  children: ReactNode
}

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    href: '/admin',                  icon: '/icons/Home (Default).svg' },
  { id: 'users',        label: 'Users',        href: '/admin/users',            icon: '/icons/Teams (Default).svg' },
  { id: 'events',       label: 'Events',       href: '/admin/events',           icon: '/icons/Events (Default).svg' },
  { id: 'articles',     label: 'Articles',     href: '/admin/articles',         icon: '/icons/Articles (Default).svg' },
  { id: 'courses',      label: 'Courses',      href: '/admin/courses',          icon: '/icons/eLearn (Default).svg' },
  { id: 'enrollments',  label: 'Enrollments',  href: '/admin/enrollments',      icon: '/icons/eLearn (Default).svg' },
  { id: 'donations',    label: 'Donations',    href: '/admin/donations',        icon: '/icons/Projects (Default).svg' },
  { id: 'home',         label: 'Home',         href: '/admin/home',             icon: '/icons/Home (Default).svg' },
  { id: 'categories',   label: 'Categories',   href: '/admin/categories',       icon: '/icons/Articles (Default).svg' },
  { id: 'settings',     label: 'Settings',     href: '/admin/settings',         icon: '/icons/Edit Profile (Default).svg' },
  { id: 'audit',        label: 'Audit Log',    href: '/admin/audit-log',        icon: '/icons/Projects (Default).svg' },
] as const

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function ExpandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
function SunMoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function AdminShell({ user, children }: AdminShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    document.body.classList.add('admin-panel')
    return () => document.body.classList.remove('admin-panel')
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/admin/auth')
    router.refresh()
  }

  const initials = user.firstName.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('')

  return (
    <div className="h-dvh w-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Top navbar — same pill aesthetic as public navbar, but isolated component */}
      <header
        className="fixed top-[14px] left-[14px] right-[14px] z-[300] glass-nav flex items-center justify-between select-none"
        style={{ height: 72, borderRadius: 22, padding: '0 24px' }}
        aria-label="Admin navigation"
      >
        <div className="flex items-center gap-3">
          <CodemoLogo width={140} />
          <span
            className="px-3 py-1 rounded-full uppercase tracking-wider"
            style={{ background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}
          >
            Admin
          </span>
          {user.role === 'super_admin' && (
            <span
              className="px-2 py-1 rounded-full uppercase tracking-wider"
              style={{ background: 'var(--input-glass)', color: 'var(--text1)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', border: '1px solid var(--border)' }}
            >
              super
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end" style={{ lineHeight: 1.2 }}>
            <span className="text-text-primary" style={{ fontSize: 14, fontWeight: 500 }}>{user.firstName}</span>
            <span className="text-text-tertiary" style={{ fontSize: 11 }}>{user.email}</span>
          </div>
          <div
            className="rounded-full overflow-hidden flex items-center justify-center text-text-primary shrink-0"
            style={{ width: 36, height: 36, background: 'var(--input-glass)', border: '1.5px solid var(--blue)' }}
          >
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="" width={36} height={36} className="object-cover w-full h-full" />
            ) : (
              <span style={{ fontSize: 12, fontWeight: 600 }}>{initials}</span>
            )}
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            style={{ padding: '8px 14px', fontSize: 13, color: 'var(--text2)', border: '1px solid var(--border)' }}
            aria-label="Sign out"
          >
            <LogoutIcon />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-[14px] bottom-[14px] z-[200] flex flex-col glass-sidebar transition-[width] duration-[260ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-hidden',
        )}
        style={{ top: 105, width: expanded ? 220 : 72, borderRadius: 22 }}
        aria-label="Admin sections"
      >
        <nav className="flex flex-col gap-[2px] flex-shrink-0 p-[14px_10px]">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'group relative flex items-center h-[56px] rounded-[14px] transition-colors duration-[120ms] outline-none focus-visible:ring-2 focus-visible:ring-accent-primary overflow-hidden whitespace-nowrap',
                  expanded ? 'justify-start gap-[16px]' : 'justify-center',
                  !isActive && 'hover:bg-white/[0.04]',
                )}
                style={{
                  paddingInline: 12,
                  background: isActive ? 'var(--input-glass)' : 'transparent',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.icon}
                  alt=""
                  width={20}
                  height={20}
                  className={cn('shrink-0 no-drag object-contain', isActive ? 'icon-active' : 'icon-idle-filter')}
                  style={{ width: 20, height: 20 }}
                  draggable={false}
                />
                {expanded && (
                  <span
                    className="pointer-events-none"
                    style={{
                      fontSize: 15,
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--text1)' : 'var(--text2)',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom: theme toggle + collapse */}
        <div className="mt-auto p-[14px_10px] flex items-center justify-around" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full p-2 text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            aria-label="Toggle theme"
          >
            <SunMoonIcon />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-full p-2 text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <CloseIcon /> : <ExpandIcon />}
          </button>
        </div>
      </aside>

      {/* Main content — fixed region so wheel/touch scroll works inside admin shell */}
      <div
        id="admin-main-content"
        className="fixed overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{
          top: 105,
          left: expanded ? 250 : 102,
          right: 32,
          bottom: 0,
          background: 'var(--bg)',
          paddingBottom: 32,
        }}
      >
        {children}
      </div>
    </div>
  )
}
