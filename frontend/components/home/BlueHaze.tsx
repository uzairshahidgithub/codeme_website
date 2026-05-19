'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface Props {
  className?: string
  /** Strength of the cursor reaction (0 = static). Default 0.6. */
  reactivity?: number
}

/* ────────────────────────────────────────────────────────────
   BlueHaze — Gaussian-blurred Codemo-blue ambient that
   follows the cursor along the top of the parent.

   Used ONLY inside the Hero (and the Hero only renders on
   the homepage), so this effect is implicitly homepage-only.

   - One large stable blue glow anchored at the top centre.
   - A second smaller blob springs toward the cursor X (and a
     little Y, clamped to the upper band so it never drifts
     below the headline).
   - Pointer events disabled — purely decorative.
   ────────────────────────────────────────────────────────── */

export function BlueHaze({ className = '', reactivity = 0.6 }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0)

  const sx = useSpring(px, { stiffness: 60, damping: 22, mass: 1.2 })
  const sy = useSpring(py, { stiffness: 60, damping: 22, mass: 1.2 })

  // Follower blob stays in the upper band so the haze never
  // covers the headline area.
  const left = useTransform(sx, (v) => `${v * 100}%`)
  const top = useTransform(sy, (v) => `${10 + v * 18}%`)

  useEffect(() => {
    // Coarse pointer (touch) gets a slow, looping auto-drift
    // instead of cursor-tracking. The blob breathes across
    // the top band on a 14s period so the hero still feels
    // alive on phones without any pointer.
    const hasFinePointer =
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches

    if (!hasFinePointer) {
      // Coarse pointer (phone): drive the follower blob
      // through a wide Lissajous figure so the hero feels
      // alive without a cursor. Larger amplitude than the
      // previous tuning (0.32/0.45 → 0.42/0.55) and slightly
      // slower periods (0.45/0.32 → 0.32/0.24) so the motion
      // reads as a slow, breathing wash rather than a tic.
      let raf = 0
      let start = 0
      function tick(t: number) {
        if (!start) start = t
        const elapsed = (t - start) / 1000
        const x = 0.5 + 0.42 * Math.sin(elapsed * 0.32)
        const y = 0.5 + 0.55 * Math.sin(elapsed * 0.24 + 1.2)
        px.set(Math.max(0, Math.min(1, x)))
        py.set(Math.max(0, Math.min(1, y)) * reactivity)
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }

    function onMove(e: PointerEvent) {
      const el = rootRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      px.set(Math.max(0, Math.min(1, x)))
      py.set(Math.max(0, Math.min(0.6, y)) * reactivity)
    }
    function onLeave() {
      px.set(0.5)
      py.set(0)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [px, py, reactivity])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Resting anchor — large stable blue glow centred up top */}
      <div
        className="absolute -top-[18%] left-1/2 -translate-x-1/2"
        style={{
          width: '90vmin',
          height: '90vmin',
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--blue) 38%, transparent) 0%, color-mix(in oklab, var(--blue) 14%, transparent) 35%, transparent 65%)',
          filter: 'blur(64px)',
          opacity: 0.85,
        }}
      />

      {/* Cursor follower — smaller blob that drifts with the
          pointer along the top */}
      <motion.div
        style={{
          left,
          top,
          width: '60vmin',
          height: '60vmin',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--blue) 60%, transparent) 0%, color-mix(in oklab, var(--blue) 18%, transparent) 35%, transparent 70%)',
          filter: 'blur(72px)',
          opacity: 0.7,
          willChange: 'transform, left, top',
        }}
        className="absolute"
      />

      {/* Horizon mist — keeps the headline reading clean */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55%]"
        style={{
          background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
        }}
      />
    </div>
  )
}
