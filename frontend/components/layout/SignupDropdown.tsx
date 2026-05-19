'use client'

import Link from 'next/link'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { SocialButton } from '@/components/ui/SocialButton'
import { getOAuthOrigin } from '@/lib/utils'

type Provider = 'google' | 'github'

interface SignupDropdownProps {
  onClose: () => void
  /** Trigger element to anchor against — same pattern as ProfileDropdown. */
  anchorRef: React.RefObject<HTMLElement | null>
}

/* ────────────────────────────────────────────────────────────
   SignupDropdown — portal-rendered popup anchored under the
   navbar's signup button. Mirrors the position + animation
   pattern used by ProfileDropdown so signed-out and signed-in
   states feel identical.
   ────────────────────────────────────────────────────────── */

export function SignupDropdown({ onClose, anchorRef }: SignupDropdownProps) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Anchor below the trigger's bottom-right corner, clamped
  // to the viewport.
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

  // Outside-click + ESC dismiss
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

  async function signInWithProvider(provider: Provider) {
    onClose()
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${getOAuthOrigin()}/auth/callback` },
    })
  }

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {pos && (
        <motion.div
          ref={menuRef}
          role="dialog"
          aria-label="Sign up or log in"
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 500 }}
          /* Surface MUST match ProfileDropdown 1:1 — same
             glass-card token, same 22px Codemo radius
             (var(--nav-radius)). Previously this popup
             read more translucent because rounded-[18px]
             overrode glass-card's 22px AND clashed with
             the inner gradient cap, producing a faint
             hairline at the corner. */
          className="w-[320px] glass-card rounded-[22px] p-5"
        >
          {/* Sign up / Login tabs */}
          <div className="flex gap-2 mb-5">
            <Link
              href="/auth/signup"
              onClick={onClose}
              className="
                flex-1 inline-flex items-center justify-center
                h-11 rounded-full text-[14px] font-medium text-white
                transition-all hover:brightness-110
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
              "
              style={{
                background: 'var(--blue)',
                boxShadow: '0 8px 20px -10px color-mix(in oklab, var(--blue) 65%, transparent)',
              }}
            >
              Sign up
            </Link>
            <Link
              href="/auth/login"
              onClick={onClose}
              className="
                flex-1 inline-flex items-center justify-center
                h-11 rounded-full text-[14px] font-medium text-text-secondary
                border border-border-subtle
                hover:text-text-primary
                transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary
              "
              style={{
                background: 'color-mix(in oklab, var(--text1) 5%, transparent)',
              }}
            >
              Login
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-text-tertiary whitespace-nowrap text-[12px] font-medium">
              or continue with
            </span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          {/* Social providers */}
          <div className="flex justify-center gap-5 mt-5">
            <SocialButton provider="google" onClick={() => signInWithProvider('google')} />
            <SocialButton provider="github" onClick={() => signInWithProvider('github')} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
