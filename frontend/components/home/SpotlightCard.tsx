'use client'

import { useRef, type ReactNode, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  /** Optional accent override; defaults to the Codemo blue. */
  accent?: string
  /** Subtle dimming inside the spotlight halo. */
  intensity?: number
  className?: string
  /** Inner padding wrapper className override. */
  innerClassName?: string
  /** Optional element to render — defaults to a div. */
  as?: 'div' | 'article' | 'section'
  /** Forward style for grid layout. */
  style?: CSSProperties
}

/* ────────────────────────────────────────────────────────────
   SpotlightCard — a glassmorphic surface with a cursor-tracked
   radial accent painted along its border.

   Mechanics:
   - Two CSS variables (--spot-x, --spot-y) follow the cursor.
   - A conic/radial gradient on the border layer reveals the
     accent only where the cursor is.
   - A second halo on the surface adds a faint inner glow.

   Aesthetic: ultra-minimal hairline borders + low-opacity
   surface. The accent only appears on hover, then fades.
   ────────────────────────────────────────────────────────── */

export function SpotlightCard({
  children,
  accent = 'var(--blue)',
  intensity = 0.16,
  className,
  innerClassName,
  as = 'article',
  style,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--spot-x', `${x}%`)
    el.style.setProperty('--spot-y', `${y}%`)
  }

  function handleLeave() {
    const el = ref.current
    if (!el) return
    // Drift the spot off-screen so the halo fades naturally
    el.style.setProperty('--spot-x', `50%`)
    el.style.setProperty('--spot-y', `-50%`)
  }

  const Tag = as as 'div'

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      data-cursor="hover"
      style={
        {
          '--spot-accent': accent,
          '--spot-intensity': intensity,
          '--spot-x': '50%',
          '--spot-y': '-50%',
          ...style,
        } as CSSProperties
      }
      className={cn('spotlight-card group relative', className)}
    >
      {/* Accent border layer (only the rim catches the spot) */}
      <span aria-hidden="true" className="spotlight-card-rim" />
      {/* Faint inner halo */}
      <span aria-hidden="true" className="spotlight-card-halo" />
      <div className={cn('relative z-[1]', innerClassName)}>{children}</div>
    </Tag>
  )
}
