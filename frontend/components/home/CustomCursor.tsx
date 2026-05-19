'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { SPRING } from '@/lib/utils'

/* ────────────────────────────────────────────────────────────
   CustomCursor — Apple-grade dot + opt-in ring.

   Refinements per spec:
   - Mounts only on the homepage (`/`). usePathname-guarded.
   - Deactivates (yields to the system cursor) when over the
     Navbar zone (top NAV_HEIGHT px) or the Sidebar zone
     (left SIDEBAR_WIDTH px on lg+).
   - "Hover" ring state triggers ONLY on elements with
     `data-cursor-active` (opt-in), keeping the cursor calm
     elsewhere on the page.
   - The soft glow trail behind the dot is offset toward the
     bottom-right (translateX 4px / translateY 6px), giving
     the cursor a subtle directional shadow.
   - Touch / coarse pointers skip the cursor entirely.
   ────────────────────────────────────────────────────────── */

const NAV_HEIGHT = 80          // top zone reserved for the floating navbar
const SIDEBAR_WIDTH = 220      // left zone reserved for the expanded sidebar (lg+)

type CursorVariant = 'idle' | 'hover' | 'hidden'

export function CustomCursor() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  const [enabled, setEnabled] = useState(false)
  const [variant, setVariant] = useState<CursorVariant>('idle')

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const cursorX = useSpring(x, SPRING.cursor)
  const cursorY = useSpring(y, SPRING.cursor)

  // Track desktop vs. small viewport so we only reserve the
  // sidebar zone where the sidebar actually renders (≥ lg).
  const isLgRef = useRef(false)

  useEffect(() => {
    if (!isHome) return
    if (typeof window === 'undefined') return

    const fine = window.matchMedia('(pointer: fine)').matches
    if (!fine) return

    const lgQuery = window.matchMedia('(min-width: 1024px)')
    isLgRef.current = lgQuery.matches
    const onLg = (e: MediaQueryListEvent) => { isLgRef.current = e.matches }
    lgQuery.addEventListener('change', onLg)

    setEnabled(true)
    document.documentElement.style.cursor = 'none'

    function onMove(e: PointerEvent) {
      // Zone detection — yield to the system cursor on top
      // of the navbar/sidebar so those surfaces feel native.
      const inNavZone = e.clientY < NAV_HEIGHT
      const inSidebarZone = isLgRef.current && e.clientX < SIDEBAR_WIDTH
      if (inNavZone || inSidebarZone) {
        document.documentElement.style.cursor = 'auto'
        setVariant('hidden')
        return
      }
      document.documentElement.style.cursor = 'none'

      x.set(e.clientX)
      y.set(e.clientY)

      // Opt-in hover: only elements marked data-cursor-active
      // grow the cursor to its ring state.
      const target = e.target as HTMLElement | null
      const active = target?.closest('[data-cursor-active], a, button, [role="button"]')
      setVariant(active ? 'hover' : 'idle')
    }

    function onLeave() {
      setVariant('hidden')
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      lgQuery.removeEventListener('change', onLg)
      document.documentElement.style.cursor = ''
    }
  }, [isHome, x, y])

  // Restore cursor when the component unmounts because we left
  // the homepage. usePathname rerenders mean we won't get here
  // through unmount on every nav, but cleanup above also runs.
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.style.cursor = ''
      }
    }
  }, [])

  if (!isHome || !enabled) return null

  const isHover = variant === 'hover'
  const isHidden = variant === 'hidden'
  const ringSize = isHover ? 44 : 8

  return (
    <>
      {/* Soft glow trail — offset DOWN-RIGHT from the dot */}
      <motion.div
        aria-hidden="true"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: isHidden ? 0 : isHover ? 0.4 : 0.22,
          scale: isHover ? 1.1 : 1,
        }}
        transition={SPRING.cursor}
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full"
      >
        <span
          aria-hidden="true"
          className="block rounded-full"
          style={{
            width: 56,
            height: 56,
            // 4 / 6 px offset gives the glow its directional drift
            transform: 'translate(4px, 6px)',
            background:
              'radial-gradient(circle at center, color-mix(in oklab, var(--blue) 60%, transparent) 0%, transparent 70%)',
            filter: 'blur(10px)',
          }}
        />
      </motion.div>

      {/* Primary ring/dot */}
      <motion.div
        aria-hidden="true"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: ringSize,
          height: ringSize,
          opacity: isHidden ? 0 : 1,
          borderColor: isHover ? 'rgba(26, 72, 254, 0.95)' : 'rgba(245, 245, 247, 0)',
          backgroundColor: isHover
            ? 'rgba(26, 72, 254, 0.06)'
            : 'rgba(245, 245, 247, 0.95)',
          borderRadius: 999,
        }}
        transition={SPRING.cursor}
        className="pointer-events-none fixed top-0 left-0 z-[9999] border mix-blend-difference"
      />

      {/* Centre tick on hover state */}
      {isHover && (
        <motion.div
          aria-hidden="true"
          style={{ x: cursorX, y: cursorY, translateX: '-50%', translateY: '-50%' }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={SPRING.cursor}
          className="pointer-events-none fixed top-0 left-0 z-[9999] w-1 h-1 rounded-full"
        >
          <span className="block w-full h-full rounded-full bg-white" />
        </motion.div>
      )}
    </>
  )
}
