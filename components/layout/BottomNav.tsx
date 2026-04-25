'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

function MenuIcon({ size, className }: { size?: number | string, className?: string }) {
  return (
    <svg width={size || "100%"} height={size || "100%"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

function CloseIcon({ size, className }: { size?: number | string, className?: string }) {
  return (
    <svg width={size || "100%"} height={size || "100%"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const navItems = [
    { id: 'events', icon: '/icons/Events (Default).svg', href: '/events' },
    { id: 'articles', icon: '/icons/Articles (Default).svg', href: '/articles' },
    { id: 'home', icon: '/icons/Home (Default).svg', href: '/' },
    { id: 'projects', icon: '/icons/Projects (Default).svg', href: '/projects' },
  ]

  const expandItems = [
    { id: 'team', label: 'Team', icon: '/icons/Teams (Default).svg', href: '/team' },
    { id: 'elearn', label: 'eLearn', icon: '/icons/eLearn (Default).svg', href: '/elearn' },
  ]

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div 
      className="fixed z-[300]" 
      ref={menuRef}
      style={{
        bottom: 'var(--mob-dock-bottom, 14px)',
        left: 'var(--mob-dock-px, 16px)',
        right: 'var(--mob-dock-px, 16px)'
      }}
    >
      
      {/* Expanded Popup Menu */}
      {menuOpen && (
        <div 
          className="absolute bottom-[calc(100%+14px)] left-0 rounded-[22px] p-4 flex gap-6 animate-in slide-in-from-bottom-2 fade-in duration-200"
          style={{
            background: '#212121',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {expandItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-2 group transition-opacity hover:opacity-80"
            >
              <img 
                src={item.icon} 
                alt={item.label} 
                className="no-drag icon-idle-filter group-hover:brightness-125 transition-all" 
                style={{ width: 'var(--mob-dock-icon-size, 24px)', height: 'var(--mob-dock-icon-size, 24px)' }}
              />
              <span className="text-text-secondary text-xs font-sans">{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Main Bottom Dock */}
      <nav
        className="flex items-center justify-center rounded-[22px] px-6 py-4"
        style={{
          height: 'var(--mob-dock-height, 64px)',
          gap: 'var(--mob-dock-gap, 32px)',
          background: '#212121',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center justify-center transition-colors focus-visible:outline-none"
            >
              <img
                src={item.icon}
                alt={item.id}
                className={cn(
                  'transition-all duration-200 no-drag',
                  isActive ? 'icon-active drop-shadow-[0_0_8px_rgba(35,85,232,0.6)]' : 'icon-idle-filter hover:brightness-125'
                )}
                style={{ width: 'var(--mob-dock-icon-size, 24px)', height: 'var(--mob-dock-icon-size, 24px)' }}
              />
            </Link>
          )
        })}

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center justify-center transition-colors focus-visible:outline-none"
          style={{ width: 'var(--mob-dock-icon-size, 24px)', height: 'var(--mob-dock-icon-size, 24px)' }}
        >
          {menuOpen ? (
            <CloseIcon className="text-accent-primary drop-shadow-[0_0_8px_rgba(35,85,232,0.6)] transition-all duration-200" />
          ) : (
            <MenuIcon className="text-[#888888] hover:text-white transition-all duration-200" />
          )}
        </button>
      </nav>
    </div>
  )
}
