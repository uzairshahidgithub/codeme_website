'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, SCROLLER_ID } from '@/lib/gsap/setup'

/**
 * Smooth-scroll provider wired to the in-app scroller (`#main-content`).
 * The body is `overflow: hidden`, so window scroll is disabled — Lenis must
 * target the actual scroller element. We bridge Lenis to GSAP's RAF and
 * notify ScrollTrigger after every Lenis tick so reveals stay in sync.
 *
 * Reduced-motion users bypass Lenis entirely (native scroll behaviour).
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    const id = SCROLLER_ID.startsWith('#') ? SCROLLER_ID.slice(1) : SCROLLER_ID
    const wrapper = document.getElementById(id)
    if (!wrapper) return

    /* Scroll feel — tuned for a slow, cinematic descent
       through the homepage sections. Iterated from the
       previous "snappy" preset:

       • `wheelMultiplier` 1 → 0.55
         Each wheel notch covers ~45% less distance. Pages
         travel deliberately, giving the per-section reveals
         time to actually play out under the user's eye.

       • `duration` 1.1 → 1.7
         Longer easing window per scroll burst. The page
         glides to its destination — no snap, no overshoot.

       • Easing: ease-out-expo → ease-out-quart
         Expo decays in the first ~25% of the curve (reads
         abrupt). Quart eases across the full arc, closer to
         native macOS scroll inertia.

       Touch is held at `touchMultiplier 1.15` (slightly
       higher than wheel) so thumb swipes still cover useful
       distance per gesture. `lerp` 0.07 is the soft fallback
       when scroll bursts overlap. */
    const lenis = new Lenis({
      wrapper,
      content: wrapper.firstElementChild as HTMLElement ?? wrapper,
      duration: 1.7,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 0.55,
      touchMultiplier: 1.15,
      lerp: 0.07,
    })

    function raf(time: number) {
      lenis.raf(time)
    }
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    lenis.on('scroll', ScrollTrigger.update)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
