'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'

/* ────────────────────────────────────────────────────────────
   useMainScrollContainer

   The (app) layout scrolls inside `<main id="main-content">`,
   not on the window (body is overflow:hidden, Lenis drives the
   element). Framer Motion's `useScroll()` defaults to window —
   which never scrolls here — so every scroll-driven hook on
   the home page must be told where the actual scroller lives.

   This hook returns a stable ref whose `.current` points at
   `#main-content` once mounted. Pass it to `useScroll({ container })`.
   ────────────────────────────────────────────────────────── */

export function useMainScrollContainer(): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null)

  // Layout effect runs in the same commit phase as useScroll's
  // internal effects, BEFORE them when declared first in a
  // component — so by the time framer-motion reads ref.current,
  // it will be populated.
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    ref.current = document.getElementById('main-content')
  }, [])

  return ref
}
