'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useMainScrollContainer } from '@/lib/useMainScrollContainer'

/* ────────────────────────────────────────────────────────────
   ScrollAmbient — a fixed full-bleed backdrop whose ambient
   hue shifts in response to scroll progress. Used as a quiet
   environment beneath every home section: blue at the top
   (hero), saffron mid-page (courses), coral around events,
   lavender for testimonials, then settling to bg by the
   donate/contact strip.

   The element is fixed and pointer-events:none so it never
   intercepts clicks. Renders behind everything (z-0).
   ────────────────────────────────────────────────────────── */

export function ScrollAmbient() {
  const container = useMainScrollContainer()
  const { scrollYProgress } = useScroll({ container })

  // Per-stop background composition. Each stop blends two radial washes
  // (one warm anchor, one cool anchor) and a base color.
  const background = useTransform(
    scrollYProgress,
    [0, 0.18, 0.38, 0.58, 0.78, 1],
    [
      // Hero — Codemo blue dominant
      'radial-gradient(80% 60% at 50% 0%, color-mix(in oklab, var(--blue) 16%, transparent) 0%, transparent 60%), radial-gradient(60% 50% at 12% 22%, color-mix(in oklab, var(--blue) 10%, transparent) 0%, transparent 60%), var(--bg)',
      // Stats / Courses — warm saffron lift
      'radial-gradient(70% 50% at 80% 18%, color-mix(in oklab, var(--accent-saffron) 12%, transparent) 0%, transparent 70%), radial-gradient(60% 50% at 10% 60%, color-mix(in oklab, var(--blue) 8%, transparent) 0%, transparent 70%), var(--bg)',
      // Events — coral pulse
      'radial-gradient(70% 55% at 85% 30%, color-mix(in oklab, var(--accent-coral) 12%, transparent) 0%, transparent 70%), radial-gradient(60% 50% at 20% 70%, color-mix(in oklab, var(--blue) 8%, transparent) 0%, transparent 70%), var(--bg)',
      // Founder — quiet blue calm
      'radial-gradient(70% 55% at 25% 30%, color-mix(in oklab, var(--blue) 14%, transparent) 0%, transparent 70%), radial-gradient(50% 50% at 75% 70%, color-mix(in oklab, var(--accent-lavender) 8%, transparent) 0%, transparent 70%), var(--bg)',
      // Testimonials — lavender stage
      'radial-gradient(70% 55% at 50% 30%, color-mix(in oklab, var(--accent-lavender) 12%, transparent) 0%, transparent 70%), radial-gradient(60% 50% at 50% 80%, color-mix(in oklab, var(--blue) 10%, transparent) 0%, transparent 70%), var(--bg)',
      // Donate / contact / footer — return to brand blue, fading out
      'radial-gradient(70% 55% at 50% 20%, color-mix(in oklab, var(--blue) 10%, transparent) 0%, transparent 75%), var(--bg)',
    ],
  )

  return (
    <motion.div
      aria-hidden="true"
      style={{ background }}
      className="fixed inset-0 -z-10 pointer-events-none transition-none"
    />
  )
}
