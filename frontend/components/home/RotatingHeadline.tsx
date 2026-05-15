'use client'

import { useEffect, useState } from 'react'

const QUOTES: ReadonlyArray<readonly string[]> = [
  ['Where talent meets', 'opportunity, every day.'],
  ['Build with brilliant', 'minds across the world.'],
  ['No gatekeepers.', 'Just open doors.'],
] as const

const HOLD_MS = 3000
const FADE_MS = 700

export function RotatingHeadline() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  // Cycle the active quote. Each tick re-keys the inner span so React
  // re-mounts it and the CSS keyframe restarts cleanly.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (paused) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length)
    }, HOLD_MS + FADE_MS)
    return () => window.clearInterval(id)
  }, [paused])

  const lines = QUOTES[index]

  return (
    <h1
      className="hero-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span
        key={index}
        className="hero-quote hero-quote-anim"
        aria-live="polite"
        style={{ animationDuration: `${FADE_MS}ms` }}
      >
        {lines.map((l, i) => (
          <span key={i} className="hero-line">{l}</span>
        ))}
      </span>
    </h1>
  )
}
