'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { gsap, ScrollTrigger, SCROLLER_ID } from '@/lib/gsap/setup'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

interface RevealOnScrollProps {
  children: ReactNode
  /** CSS class applied to the wrapper. Animation always targets direct children. */
  className?: string
  /** Stagger between children, in seconds. Default 0.12. */
  stagger?: number
  /** Per-child duration. Default 0.7. */
  duration?: number
  /** Vertical offset before reveal, in px. Default 30. */
  yFrom?: number
  /** ScrollTrigger start value. Default 'top 75%'. */
  start?: string
}

/**
 * Wraps a grid/group of elements and reveals each direct child as the
 * wrapper enters the viewport. Used by Events, Courses, Testimonials.
 *
 * Initial state (opacity:0, translateY) is set via gsap.set on the same
 * tick as the ScrollTrigger so children are never visible before reveal.
 * The from-state is stamped synchronously to avoid the FOUC pattern
 * documented in spec §Part 1.b.i.
 */
export function RevealOnScroll({
  children,
  className,
  stagger = 0.12,
  duration = 0.7,
  yFrom = 30,
  start = 'top 75%',
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (reduced) {
      // Render immediately at final state — no scroll trigger
      gsap.set(el.children, { opacity: 1, y: 0, clearProps: 'transform' })
      return
    }

    const ctx = gsap.context(() => {
      // Stamp initial state synchronously so children don't flash visible
      gsap.set(el.children, { opacity: 0, y: yFrom })

      const scroller = el.closest('main') || window
      gsap.to(el.children, {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          scroller: scroller,
          start,
          once: true,
        },
      })
    }, el)

    // Force a refresh after layout settles (images, fonts)
    ScrollTrigger.refresh()

    return () => {
      ctx.revert()
    }
  }, [reduced, stagger, duration, yFrom, start])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
