'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignupDropdown } from './SignupDropdown'
import { ProfileDropdown } from './ProfileDropdown'
import { CodemoLogo } from '@/components/ui/CodemoLogo'
import { EditProfileDrawer } from '@/components/profile/EditProfileDrawer'
import { SettingsDrawer } from '@/components/profile/SettingsDrawer'

interface NavbarUser {
  firstName: string
  avatarUrl?: string | null
}

interface NavbarProps {
  isAuthenticated: boolean
  user?: NavbarUser | null
}

function UserIcon() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function Navbar({ isAuthenticated, user }: NavbarProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Separate refs for desktop and mobile to avoid conflicts
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const desktopDropdownRef = useRef<HTMLDivElement>(null)
  const mobileSearchBtnRef = useRef<HTMLButtonElement>(null)
  const mobileSearchOverlayRef = useRef<HTMLDivElement>(null)

  // Close dropdown/search on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      // If the clicked element was removed from the DOM by a React re-render
      // (e.g. search button replaced by input), skip — otherwise we'd
      // immediately close what we just opened.
      if (!document.contains(target)) return

      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(target) &&
        (!mobileSearchBtnRef.current || !mobileSearchBtnRef.current.contains(target)) &&
        (!mobileSearchOverlayRef.current || !mobileSearchOverlayRef.current.contains(target))
      ) {
        setSearchOpen(false)
      }
      if (
        desktopDropdownRef.current &&
        !desktopDropdownRef.current.contains(target)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setDropdownOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      <style>{`
        .navbar-responsive {
          height: var(--mob-nav-height, 64px);
          top: var(--nav-top, 14px);
          border-radius: var(--nav-radius, 22px);
          gap: 12px;
          padding-left: var(--mob-nav-px, 16px);
          padding-right: var(--mob-nav-px, 16px);
          left: 14px;
          right: 14px;
        }
        @media (min-width: 1024px) {
          .navbar-responsive {
            height: var(--nav-height, 72px);
            top: var(--nav-top, 14px);
            border-radius: var(--nav-radius, 22px);
            gap: var(--nav-gap, 12px);
            padding-left: var(--nav-px, 24px);
            padding-right: var(--nav-px, 24px);
            left: 14px;
            right: 14px;
          }
        }
      `}</style>

      <nav
        className="fixed z-[300] glass-nav flex items-center select-none transition-all duration-[50ms] navbar-responsive"
        aria-label="Main navigation"
      >
        {/* Skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-text-primary focus:rounded-md focus:text-sm"
        >
          Skip to content
        </a>

        {/* ── MOBILE: Left Search icon ── */}
        <div className="flex lg:hidden items-center shrink-0 w-[42px]">
          <button
            ref={mobileSearchBtnRef}
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="flex items-center justify-center text-[#888888] hover:text-white transition-colors"
            style={{ width: 'var(--nav-search-size, 24px)', height: 'var(--nav-search-size, 24px)' }}
          >
            <SearchIcon />
          </button>
        </div>

        {/* ── DESKTOP: Logo ── */}
        <Link href="/" className="hidden lg:flex items-center shrink-0" aria-label="Codemo home">
          <CodemoLogo width={220} />
        </Link>

        {/* ── MOBILE: Centered Logo ── */}
        <Link href="/" className="flex lg:hidden flex-1 justify-center items-center" aria-label="Codemo home">
          <div style={{ width: 'var(--mob-nav-logo-size, 140px)' }}>
            <CodemoLogo width="100%" />
          </div>
        </Link>

        {/* Spacer (Desktop only) */}
        <div className="hidden lg:flex flex-1" />

        {/* ── DESKTOP: Right cluster (Nav links + Search + Sign Up) ── */}
        <div className="hidden lg:flex items-center" style={{ gap: 'var(--nav-action-gap, 14px)' }}>

          {/* Nav links */}
          <div className="flex items-center mr-4" style={{ gap: 'var(--nav-link-gap, 32px)' }}>
            {[
              { label: 'Join Us', href: '/join-us' },
              { label: 'Donate', href: '/donate' },
              { label: 'Contact', href: '/contact' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-tertiary hover:text-text-primary transition-colors duration-150 whitespace-nowrap"
                style={{ fontSize: 'var(--nav-link-size, 18px)', fontWeight: 300, letterSpacing: '0.01em', fontFamily: 'var(--font-sans)' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Search */}
          <div ref={searchWrapperRef} className="relative">
            {!searchOpen ? (
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="rounded-full flex items-center justify-center text-text-tertiary hover:bg-white/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                style={{
                  width: '42px',
                  height: '42px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.14)',
                  boxShadow: '0 0 0 3px var(--ring), inset 0 1px 0 var(--inner-hi)',
                  backdropFilter: 'var(--blur)',
                  WebkitBackdropFilter: 'var(--blur)'
                }}
              >
                <div style={{ width: 'var(--nav-search-size, 24px)', height: 'var(--nav-search-size, 24px)' }}>
                  <SearchIcon />
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 glass-input rounded-[22px] px-4 h-[42px] w-[250px] animate-search-expand search-transition">
                <input
                  autoFocus
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
                  className="bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted font-sans text-body w-full caret-accent-primary"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search"
                  className="text-text-muted hover:text-text-secondary shrink-0 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>
            )}
          </div>

          {/* Desktop Sign Up / Profile button + dropdown */}
          <div ref={desktopDropdownRef} className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              className="flex items-center gap-[9px] rounded-full pl-[16px] pr-[6px] py-[6px] transition-colors duration-150 focus-visible:outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid rgba(255,255,255,0.13)',
                boxShadow: '0 0 0 3px var(--ring), inset 0 1px 0 var(--inner-hi)',
                backdropFilter: 'var(--blur)',
                WebkitBackdropFilter: 'var(--blur)'
              }}
            >
              <span
                className="text-text-primary whitespace-nowrap transition-all duration-[50ms]"
                style={{ fontSize: 'var(--nav-button-size, 18px)', fontWeight: 300, fontFamily: 'var(--font-sans)' }}
              >
                {isAuthenticated && user ? user.firstName : 'Sign Up'}
              </span>
              <div
                className="w-[36px] h-[36px] rounded-full flex items-center justify-center shrink-0 overflow-hidden text-text-tertiary"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  boxShadow: '0 0 0 2.5px var(--ring)'
                }}
              >
                {isAuthenticated && user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div style={{ width: 'calc(var(--nav-button-size, 18px) * 1.2)', height: 'calc(var(--nav-button-size, 18px) * 1.2)' }}>
                    <UserIcon />
                  </div>
                )}
              </div>
            </button>

            {/* Desktop dropdown — sign up/login tabs OR profile */}
            {dropdownOpen && (
              isAuthenticated && user ? (
                <ProfileDropdown
                  user={user}
                  onClose={() => setDropdownOpen(false)}
                  onEditProfile={() => setEditProfileOpen(true)}
                  onSettings={() => setSettingsOpen(true)}
                />
              ) : (
                <SignupDropdown onClose={() => setDropdownOpen(false)} />
              )
            )}
          </div>
        </div>

        {/* ── MOBILE: Right avatar — goes directly to /auth (no popup) ── */}
        <div className="flex lg:hidden items-center justify-end shrink-0 w-[42px]">
          <button
            onClick={() => {
              if (isAuthenticated && user) {
                // authenticated: could open profile, for now just navigate
                router.push('/profile')
              } else {
                router.push('/auth')
              }
            }}
            aria-label="Account"
            className="rounded-full flex items-center justify-center overflow-hidden text-text-tertiary"
            style={{
              width: 'var(--nav-search-size, 32px)',
              height: 'var(--nav-search-size, 32px)',
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.18)'
            }}
          >
            {isAuthenticated && user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="Profile"
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            ) : (
              <div style={{ width: 'calc(var(--nav-search-size, 24px) * 0.75)', height: 'calc(var(--nav-search-size, 24px) * 0.75)' }}>
                <UserIcon />
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* ── MOBILE: Full-screen search overlay (only renders on mobile) ── */}
      {searchOpen && (
        <div
          className="fixed lg:hidden inset-0 z-[400] flex flex-col justify-end"
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'rgba(0,0,0,0.45)'
          }}
        >
          {/* Tap backdrop to close */}
          <div className="flex-1" onClick={() => setSearchOpen(false)} />

          {/* Search bar */}
          <div
            ref={mobileSearchOverlayRef}
            className="mx-[14px] flex items-center gap-2.5 rounded-[22px] px-4 h-[56px] shrink-0"
            style={{
              marginBottom: 'var(--mob-search-popup-bottom, 90px)',
              background: '#212121',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <input
              autoFocus
              type="search"
              placeholder="Search"
              aria-label="Search"
              onKeyDown={(e) => e.key === 'Escape' && setSearchOpen(false)}
              className="bg-transparent border-none outline-none text-text-primary placeholder:text-text-muted font-sans w-full caret-accent-primary"
              style={{ fontSize: '16px' }}
            />
            <button
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="text-text-muted hover:text-white shrink-0 transition-colors"
              style={{ width: '20px', height: '20px' }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {/* Drawers — portal to document.body via Drawer primitive */}
      <EditProfileDrawer
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onEditProfile={() => { setSettingsOpen(false); setEditProfileOpen(true) }}
      />
    </>
  )
}
