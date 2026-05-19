'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/* ────────────────────────────────────────────────────────────
   Drawer — right-side panel with proper enter AND exit motion.

   Previously the panel mounted/unmounted instantly and only
   ran a CSS keyframe on enter — so closing felt abrupt. Now
   wrapped in <AnimatePresence>: on open the backdrop fades in
   and the panel slides in from the right; on close the
   reverse plays before the panel unmounts.

   Backdrop and panel are still portalled into <body> so the
   drawer is never clipped by surrounding overflow:hidden
   containers, and the body scroll is locked while open.
   ────────────────────────────────────────────────────────── */

export function Drawer({ open, onClose, title, children }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

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

  // Focus trap — initial focus + Tab cycling
  useEffect(() => {
    if (!open || !drawerRef.current) return
    const el = drawerRef.current
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

    function onTab(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(
        (n) => !n.hasAttribute('disabled'),
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
    const t = setTimeout(() => {
      const focusable = el.querySelectorAll<HTMLElement>(selector)
      focusable[0]?.focus()
    }, 80)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onTab)
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[600]"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Backdrop — fade */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel — slide in from the right, slide out
              to the right. Spring curves keep it tactile but
              never overshoot.
              Surface + drop shadow use the design tokens
              (`--card-glass`, `--shadow`) so the panel renders
              correctly in BOTH dark and light themes — the
              previous hardcoded `rgba(0,0,0,.45)` shadow was a
              hard black line in light mode and invisible in
              dark mode. */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 }}
            className="absolute top-0 right-0 h-full flex flex-col border-l border-border-subtle"
            style={{
              width: 'min(480px, 100vw)',
              background: 'var(--card-glass)',
              backdropFilter: 'blur(24px) saturate(140%)',
              WebkitBackdropFilter: 'blur(24px) saturate(140%)',
              boxShadow: 'var(--shadow)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 shrink-0 border-b border-border-subtle"
              style={{ height: 64 }}
            >
              {title ? (
                <h2 id="drawer-title" className="text-text-primary text-[17px] font-semibold tracking-tight">
                  {title}
                </h2>
              ) : <span />}
              <button
                onClick={onClose}
                className="
                  inline-flex items-center justify-center
                  w-9 h-9 rounded-full
                  text-text-tertiary hover:text-text-primary
                  hover:bg-text-primary/[0.06]
                  transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
                "
                aria-label="Close"
              >
                <svg
                  width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
