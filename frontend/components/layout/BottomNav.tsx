'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { id: 'events', icon: '/icons/Events (Default).svg', href: '/events' },
    { id: 'articles', icon: '/icons/Articles (Default).svg', href: '/articles' },
    { id: 'home', icon: '/icons/Home (Default).svg', href: '/' },
    { id: 'eduto', icon: '/icons/Eduto (Default).svg', href: '/eduto' },
    { id: 'projects', icon: '/icons/Projects (Default).svg', href: '/projects' },
  ]

  return (
    <div 
      className="fixed z-[300]" 
      style={{
        bottom: 'var(--mob-dock-bottom, 14px)',
        left: 'var(--mob-dock-px, 16px)',
        right: 'var(--mob-dock-px, 16px)'
      }}
    >
      {/* Main dock */}
      <nav
        className="flex items-center justify-center rounded-[22px] glass-sidebar"
        style={{
          height: 'var(--mob-dock-height, 64px)',
          paddingLeft: 'var(--mob-dock-px, 16px)',
          paddingRight: 'var(--mob-dock-px, 16px)',
          gap: 'var(--mob-dock-gap, 32px)',
        }}
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className="flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-lg p-1"
            >
              <img
                src={item.icon}
                alt={item.id}
                className={cn(
                  'transition-all duration-200 no-drag',
                  isActive ? 'icon-active drop-shadow-[0_0_8px_rgba(35,85,232,0.6)]' : 'icon-idle-filter hover:brightness-125',
                )}
                style={{ width: 'var(--mob-dock-icon-size, 24px)', height: 'var(--mob-dock-icon-size, 24px)' }}
              />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
