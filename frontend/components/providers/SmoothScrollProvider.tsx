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

    /* Scroll feel — native wheel by default; Lenis stays attached so
       GSAP ScrollTrigger keeps receiving scroll updates. Touch keeps a
       light ease so thumb swipes don't feel sticky. */
    const lenis = new Lenis({
      wrapper,
      content: wrapper.firstElementChild as HTMLElement ?? wrapper,
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      lerp: 0.1,
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
