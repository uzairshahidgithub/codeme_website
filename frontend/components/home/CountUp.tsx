'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

/* ────────────────────────────────────────────────────────────
   CountUp — animates a number from 0 up to `target` once the
   element scrolls into view (or immediately on mount if it's
   already on-screen). Used by the Hero stat row.

   Props:
     • target      — final numeric value (e.g. 12400, 340, 48).
     • suffix      — string appended to every frame (e.g. '+').
     • format      — 'plain' renders rounded integers;
                     'compact' uses Intl compact notation so
                     12400 → '12.4k' during the run.
     • duration    — seconds for the count to reach `target`.
     • delay       — seconds to wait after entering view
                     before starting (used to stagger the row).
     • startOn     — 'mount' fires immediately, 'inview' waits
                     until the element scrolls into view.

   Respects prefers-reduced-motion by jumping straight to the
   final formatted value.
   ────────────────────────────────────────────────────────── */

interface CountUpProps {
  target: number
  suffix?: string
  format?: 'plain' | 'compact'
  duration?: number
  delay?: number
  startOn?: 'mount' | 'inview'
  className?: string
}

function formatNumber(n: number, format: 'plain' | 'compact'): string {
  if (format === 'compact') {
    return Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n)
  }
  return Math.round(n).toLocaleString('en')
}

export function CountUp({
  target,
  suffix = '',
  format = 'plain',
  duration = 1.8,
  delay = 0,
  startOn = 'inview',
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  // SSR-friendly initial value — render the final formatted
  // string so the markup never shows a literal "0" if JS is
  // disabled or before hydration completes.
  const [display, setDisplay] = useState<string>(formatNumber(target, format))
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    if (startOn === 'inview' && !inView) return

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplay(formatNumber(target, format))
      startedRef.current = true
      return
    }

    // Begin from 0 only when we actually start animating —
    // setting it here (not in initial state) avoids a flash
    // of "0" during hydration if startOn === 'mount'.
    setDisplay(formatNumber(0, format))
    startedRef.current = true

    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(formatNumber(latest, format)),
      onComplete: () => setDisplay(formatNumber(target, format)),
    })
    return () => controls.stop()
  }, [inView, startOn, target, format, duration, delay])

  return (
    <span
      ref={ref}
      className={className}
      aria-label={`${formatNumber(target, format)}${suffix}`}
    >
      {display}
      {suffix}
    </span>
  )
}
