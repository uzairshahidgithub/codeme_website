'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const mounted = typeof document !== 'undefined'

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // ESC close
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Focus trap
  useEffect(() => {
    if (!open || !drawerRef.current) return
    const el = drawerRef.current
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    function onTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(
        (n) => !n.hasAttribute('disabled')
      )
      if (focusable.length === 0) { e.preventDefault(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    document.addEventListener('keydown', onTab)
    // Defer focus so the drawer panel is painted first
    const t = setTimeout(() => {
      const focusable = el.querySelectorAll<HTMLElement>(selector)
      focusable[0]?.focus()
    }, 60)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onTab)
    }
  }, [open])

  if (!open || !mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[600]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="drawer-panel absolute top-0 right-0 h-full flex flex-col"
        style={{
          width: 'min(480px, 100vw)',
          background: 'var(--card-glass)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 60px rgba(0,0,0,0.4)',
          animation: 'drawer-slide-in 0.28s cubic-bezier(0.4,0,0.2,1) both',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 shrink-0"
          style={{ height: 64, borderBottom: '1px solid var(--border)' }}
        >
          {title ? (
            <h2
              id="drawer-title"
              className="text-text-primary"
              style={{ fontSize: 17, fontWeight: 600 }}
            >
              {title}
            </h2>
          ) : <span />}
          <button
            onClick={onClose}
            className="rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            style={{ width: 36, height: 36 }}
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
