'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Per-element offset before reveal. Default 16. */
  y?: number
  /** Optional delay in seconds. */
  delay?: number
  /** Reveal duration in seconds. */
  duration?: number
  className?: string
  /** Apply once and never replay. Default true. */
  once?: boolean
  /** Render as a different element. Default div. */
  as?: 'div' | 'section' | 'header'
}

/* ────────────────────────────────────────────────────────────
   SoftReveal — gentle whileInView fade-up.

   Apple-style easing, single tween (no spring). Triggers once
   per element when it crosses ~10 % into the viewport so the
   motion reads as intentional, not gimmicky.
   ────────────────────────────────────────────────────────── */

export function SoftReveal({
  children,
  y = 16,
  delay = 0,
  duration = 0.7,
  className,
  once = true,
  as = 'div',
}: Props) {
  const Tag = motion[as] as typeof motion.div
  return (
    <Tag
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '0px 0px -10% 0px' }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </Tag>
  )
}
