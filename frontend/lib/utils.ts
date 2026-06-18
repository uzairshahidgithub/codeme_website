import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Variants, Transition } from 'framer-motion'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ────────────────────────────────────────────────────────────
   getOAuthOrigin — returns the current window origin
   normalized to `localhost` for any raw IP host that breaks
   Supabase OAuth round-trips.

   Why: Supabase OAuth providers are typically allow-listed
   for `http://localhost:3000`. If the dev server is opened
   on `0.0.0.0` (default `next dev --hostname 0.0.0.0` here)
   OR `127.0.0.1`, the callback comes back to the same raw
   IP and the provider rejects it, OR cookies set on one
   host don't apply to the other, leaving the user stranded.

   This helper centralizes the rewrite so EVERY OAuth /
   email-redirect URL in the app uses the same origin. */
export function getOAuthOrigin(): string {
  if (typeof window === 'undefined') return ''
  // The proxy gateway redirect ensures users are always on localhost,
  // so we return the real origin here. Rewriting 0.0.0.0 → localhost
  // here would cause PKCE cookie domain mismatch.
  return window.location.origin
}

/** Cloudflare dummy site key — always passes, works on any hostname (incl. localhost). */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'

/**
 * Returns the Cloudflare Turnstile site key for the current environment.
 *
 * In development we default to Cloudflare's test site key so the widget loads
 * on localhost without error 110200 ("domain not authorized"). Production site
 * keys only work locally after adding `localhost` under Cloudflare Turnstile →
 * Hostname Management, then setting `NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_IN_DEV=true`.
 *
 * Supabase Auth verifies captcha tokens with the production Turnstile secret,
 * so OTP/login in local dev requires that production-in-dev flag once localhost
 * is whitelisted in Cloudflare.
 */
export function getTurnstileSiteKey(): string {
  const productionKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  if (process.env.NODE_ENV === 'development') {
    if (
      process.env.NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_IN_DEV === 'true' &&
      productionKey
    ) {
      return productionKey
    }
    return TURNSTILE_TEST_SITE_KEY
  }

  return productionKey || TURNSTILE_TEST_SITE_KEY
}

/** Maps Turnstile client error codes to actionable messages. */
export function getTurnstileErrorMessage(code: string): string {
  if (code === '110200') {
    return (
      'Security check failed: localhost is not authorized for this Turnstile key. ' +
      'Add localhost under Cloudflare Turnstile → Hostname Management, then set ' +
      'NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_IN_DEV=true in frontend/.env.local and restart the dev server.'
    )
  }
  return `Security check failed to load (${code}).`
}

/* ────────────────────────────────────────────────────────────
   MOTION TOKENS — shared springs and variants for the homepage
   design system. All transitions are physics-based; never use
   linear easings outside of background loops.
   ────────────────────────────────────────────────────────── */

export const SPRING = {
  // Magnetic / cursor follows — snappy, no overshoot
  cursor: { type: 'spring', stiffness: 360, damping: 28, mass: 0.4 } as Transition,
  // UI surface entrances — gentle settle
  surface: { type: 'spring', stiffness: 220, damping: 26, mass: 0.8 } as Transition,
  // Hero / large display — heavier mass, slower settle
  display: { type: 'spring', stiffness: 140, damping: 22, mass: 1.1 } as Transition,
  // Soft body content
  soft: { type: 'spring', stiffness: 180, damping: 24 } as Transition,
  // Tech-vibes default (per brief): premium settle with controlled mass
  tech: { type: 'spring', stiffness: 120, damping: 22, mass: 1 } as Transition,
  // Hero-grade settle — slightly looser for headline reveals
  hero: { type: 'spring', stiffness: 90, damping: 20, mass: 1 } as Transition,
}

export const EASE = {
  // Custom out-expo — used for non-spring fades only
  outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
  outQuart: [0.22, 1, 0.36, 1] as [number, number, number, number],
}

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: SPRING.surface,
  },
}

export const fadeRiseSm: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: SPRING.soft,
  },
}

export const staggerParent: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

/* Per-line blinds variant — used by BlindsTextReveal.
   Each slat rotates from -90° around the bottom edge, settling open. */
export const blindsSlat: Variants = {
  hidden: {
    rotateX: -92,
    y: '40%',
    opacity: 0,
  },
  show: {
    rotateX: 0,
    y: '0%',
    opacity: 1,
    transition: SPRING.display,
  },
}

/* Returns a deterministic pseudo-random sequence in [0, 1) for a given seed.
   Used by PixelImageLoad to choreograph pixel reveals without hydration
   mismatches (Math.random would re-roll between server and client). */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

/* Honor reduce-motion. SSR-safe (returns false on the server). */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
