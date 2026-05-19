'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useMainScrollContainer } from '@/lib/useMainScrollContainer'

interface Props {
  text: string
  /** Tailwind classes for sizing/weight. */
  className?: string
  /** Inline style forwarded to both text layers (e.g. font-size clamp). */
  style?: React.CSSProperties
}

/* ────────────────────────────────────────────────────────────
   ScrollMaskReveal — multi-line clip-path text reveal.

   How it works:
     - The paragraph is rendered twice in the same flow box:
         1) A ghost copy at low opacity (the "unrevealed" ink).
         2) A clipped copy stacked on top at full opacity.
     - As the paragraph scrolls through the viewport, the
       clip-path animates `inset(0 100% 0 0)` → `inset(0 0% 0 0)`,
       wiping the foreground text in cleanly from left to right.

   Result: every line of the paragraph reveals at the same
   horizontal rate (no per-word stagger, no per-word blur), so
   long lines never produce the broken "right-side blur" the
   previous implementation suffered from.
   ────────────────────────────────────────────────────────── */

export function ScrollMaskReveal({ text, className, style }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const container = useMainScrollContainer()
  const { scrollYProgress } = useScroll({
    container,
    target: ref,
    offset: ['start 85%', 'end 55%'],
  })

  // Convert progress (0 → 1) into a clip-path inset that opens
  // from the right edge of each line.
  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
  )

  return (
    <div ref={ref} className="relative">
      {/* Ghost layer — text always present at low opacity so
          the paragraph reserves its full height and width and
          unrevealed words still read as muted text. */}
      <p className={className} style={{ ...style, opacity: 0.22 }}>
        {text}
      </p>

      {/* Revealed layer — same paragraph stacked exactly on top,
          clipped by an animated inset. Pointer-events disabled
          so links underneath (if any) remain interactive. */}
      <motion.p
        aria-hidden="true"
        className={className}
        style={{
          ...style,
          position: 'absolute',
          inset: 0,
          margin: 0,
          pointerEvents: 'none',
          clipPath,
          WebkitClipPath: clipPath as unknown as string,
        }}
      >
        {text}
      </motion.p>
    </div>
  )
}
