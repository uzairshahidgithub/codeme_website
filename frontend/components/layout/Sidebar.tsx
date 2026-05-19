'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useSidebarStore } from '@/stores/sidebar'
import { useThemeStore } from '@/stores/theme'
import { cn } from '@/lib/utils'

/* ────────────────────────────────────────────────────────────
   SidebarBackdrop — mirror of NavBackdrop:
     • soft permanent blur (14px / saturate 160%)
     • mid-range opacity tint (0.62)

   Same split rationale: opacity stays on the tint layer only
   so the backdrop blur is never weakened by it.
   ────────────────────────────────────────────────────────── */
function SidebarBackdrop() {
  return (
    <>
      {/* Both layers carry data-sidebar-bg so the
          `.codemo-sidebar-shell > *:not([data-sidebar-bg])`
          rule in the parent doesn't promote them above the
          icons / labels. */}
      <span
        data-sidebar-bg
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 'inherit',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
        }}
      />
      <span
        data-sidebar-bg
        aria-hidden="true"
        style={{
          borderRadius: 'inherit',
          background: 'var(--side-glass)',
          border: '1px solid var(--border)',
          boxShadow:
            'inset 0 1px 0 var(--inner-hi), 0 2px 12px var(--nav-shadow-color, rgba(0,0,0,0.12)), 0 8px 32px var(--nav-shadow-spread, rgba(0,0,0,0.08))',
          opacity: 0.62,
        }}
        className="absolute inset-0 pointer-events-none"
      />
    </>
  )
}

const navItems = [
  { id: 'home', label: 'Home', icon: '/icons/Home (Default).svg', href: '/' },
  { id: 'events', label: 'Events', icon: '/icons/Events (Default).svg', href: '/events' },
  { id: 'articles', label: 'Articles', icon: '/icons/Articles (Default).svg', href: '/articles' },
  { id: 'eduto', label: 'Eduto', icon: '/icons/Eduto (Default).svg', href: '/eduto' },
  { id: 'projects', label: 'Projects', icon: '/icons/Projects (Default).svg', href: '/projects' },
]

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: 'var(--sidebar-icon-size, 24px)', height: 'var(--sidebar-icon-size, 24px)', filter: 'var(--icon-idle)' }}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function Sidebar() {
  const isExpanded = useSidebarStore((s) => s.isExpanded)
  const expand = useSidebarStore((s) => s.expand)
  const collapse = useSidebarStore((s) => s.collapse)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const pathname = usePathname()

  // Force collapse on narrow viewports
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) collapse()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [collapse])

  return (
    <div className="fixed left-[14px] bottom-[14px] flex flex-col z-[200]" style={{ top: 'var(--sidebar-top, 100px)' }}>
      {/* Scoped CSS — promote every direct child of the aside
          (except the scroll-fade backdrop) above the absolute
          backdrop so icons + labels stay visible at all times. */}
      <style>{`
        .codemo-sidebar-shell > *:not([data-sidebar-bg]) {
          position: relative;
          z-index: 1;
        }
      `}</style>
      <aside
        className={cn(
          'codemo-sidebar-shell flex flex-col flex-1 shrink-0 sidebar-transition transition-[width] duration-[260ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-hidden rounded-[22px] relative',
          isExpanded ? 'w-[200px]' : 'w-[70px]'
        )}
        aria-label="Sidebar navigation"
      >
        <SidebarBackdrop />
        {/* Nav items */}
        <nav className="flex flex-col gap-[2px] flex-shrink-0 p-[14px_10px]">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'group relative flex items-center h-[56px] rounded-[14px] transition-all duration-[50ms] outline-none focus-visible:ring-2 focus-visible:ring-accent-primary overflow-hidden whitespace-nowrap bg-transparent',
                  isExpanded ? 'justify-start' : 'justify-center',
                  !isActive && 'hover:opacity-70'
                )}
                style={{
                  gap: isExpanded ? 'var(--sidebar-item-gap, 16px)' : '0px',
                  paddingLeft: 'var(--sidebar-item-px, 12px)',
                  paddingRight: 'var(--sidebar-item-px, 12px)'
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Icon */}
                <div className="flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.icon}
                    alt={item.label}
                    width={24}
                    height={24}
                    className={cn('no-drag transition-all duration-[50ms]', isActive ? 'icon-active' : 'icon-idle-filter')}
                    style={{ width: 'var(--sidebar-icon-size, 24px)', height: 'var(--sidebar-icon-size, 24px)' }}
                    draggable={false}
                  />
                </div>

                {/* Label */}
                {isExpanded && (
                  <span
                    className={cn(
                      'transition-opacity duration-[220ms] pointer-events-none',
                      isActive ? 'text-accent-primary' : 'text-text-secondary'
                    )}
                    style={{
                      fontSize: 'var(--sidebar-text-size, 16px)',
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                )}

                {/* Tooltip (collapsed only) */}
                {!isExpanded && (
                  <span
                    role="tooltip"
                    className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 text-text-primary text-caption px-3 py-1.5 rounded-[8px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md z-50"
                    style={{ background: 'var(--card-glass)', border: '1px solid var(--border)' }}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom utility row */}
        <div className={cn("shrink-0 border-t border-border-subtle mx-[10px] py-[12px] flex", isExpanded ? "flex-row items-center justify-between px-2" : "flex-col items-center gap-2")}>
          
          {/* Expand / Collapse */}
          <button
            onClick={isExpanded ? collapse : expand}
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            className="w-[46px] h-[46px] flex items-center justify-center transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary bg-transparent"
          >
            {isExpanded ? (
              <CloseIcon />
            ) : (
              <img src="/icons/Expand Dock (Default).svg" alt="Expand sidebar" className="no-drag icon-idle-filter" style={{ width: 'var(--sidebar-icon-size, 24px)', height: 'var(--sidebar-icon-size, 24px)' }} draggable={false} />
            )}
          </button>

          {/* Light / Dark toggle */}
          <button
            onClick={toggleTheme}
            className="w-[46px] h-[46px] flex items-center justify-center transition-all duration-[50ms] hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary bg-transparent"
            aria-label="Toggle theme"
          >
            <img
              src="/icons/Light Mode (Default).svg"
              alt="Toggle theme"
              width={24}
              height={24}
              className="no-drag icon-idle-filter"
              style={{ width: 'var(--sidebar-icon-size, 24px)', height: 'var(--sidebar-icon-size, 24px)' }}
              draggable={false}
            />
          </button>
        </div>
      </aside>

      {/* Jams Bot orb */}
      <div className="mt-[12px] flex justify-center">
        <button
          className="rounded-full flex items-center justify-center transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ width: 'var(--jamsbot-size, 46px)', height: 'var(--jamsbot-size, 46px)' }}
          aria-label="Jams Bot"
        >
          <img src="/icons/Jams Bot (Default).svg" alt="Jams Bot" className="no-drag" draggable={false} style={{ width: 'var(--jamsbot-size, 46px)', height: 'var(--jamsbot-size, 46px)' }} />
        </button>
      </div>
    </div>
  )
}
