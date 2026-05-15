'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger, SCROLLER_ID } from '@/lib/gsap/setup'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

interface FounderRevealProps {
  photo: ReactNode
  body: ReactNode
  className?: string
}

/**
 * Client wrapper for the Founder Message section.
 * Server component fetches the data, this wrapper just animates.
 *
 * SLIDE 7: photo slides in from the left
 * SLIDE 8: text slides in from the right (with a small delay)
 */
export function FounderReveal({ photo, body, className }: FounderRevealProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const photoRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const section = sectionRef.current
    const photoEl = photoRef.current
    const bodyEl = bodyRef.current
    if (!section || !photoEl || !bodyEl) return

    if (reduced) {
      gsap.set([photoEl, bodyEl], { opacity: 1, x: 0, clearProps: 'transform' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(photoEl, { opacity: 0, x: -40 })
      gsap.set(bodyEl, { opacity: 0, x: 40 })

      const scroller = section.closest('main') || window
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          scroller: scroller,
          start: 'top 70%',
          once: true,
        },
      })

      // ─────────────────────────────────────
      // SLIDE 7: Founder Photo — ScrollTrigger slide-right
      // Trigger: section top hits 70% viewport
      // Element: .founder-photo
      // Motion: translateX(-40px) opacity 0 → translateX(0) opacity 1
      // Duration: 0.9s, ease: power3.out, once: true
      // ─────────────────────────────────────
      tl.to(photoEl, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' })

      // ─────────────────────────────────────
      // SLIDE 8: Founder Text — ScrollTrigger slide-left
      // Trigger: same as photo, +0.2s delay
      // Element: .founder-message
      // Motion: translateX(40px) opacity 0 → translateX(0) opacity 1
      // Duration: 0.9s, ease: power3.out, once: true
      // ─────────────────────────────────────
        .to(bodyEl, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, '-=0.7')
    }, section)

    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200)

    return () => {
      window.clearTimeout(refreshTimer)
      ctx.revert()
    }
  }, [reduced])

  return (
    <div ref={sectionRef} className={className}>
      <div ref={photoRef} className="founder-photo lg:col-span-4 flex justify-center lg:justify-start" style={{ opacity: 0 }}>
        {photo}
      </div>
      <div ref={bodyRef} className="founder-message lg:col-span-8 relative" style={{ opacity: 0 }}>
        {body}
      </div>
    </div>
  )
}
