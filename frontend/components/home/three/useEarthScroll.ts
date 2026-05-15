'use client'

import { useEffect, useRef } from 'react'

/**
 * Subscribes to the app shell scroller (#main-content) and writes a 0→1
 * progress value into a ref as the hero is being scrolled past. Returns
 * the ref so EarthScene can read it inside useFrame and lerp camera state.
 *
 * 0 → hero fully in view, top of page
 * 1 → bottom of hero has reached top of viewport
 */
export function useEarthScroll() {
  const progressRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const scroller = document.getElementById('main-content')
    if (!scroller) return

    function update() {
      const sc = document.getElementById('main-content')
      if (!sc) return
      const heroHeight = sc.clientHeight
      const scrollY = sc.scrollTop
      const raw = scrollY / Math.max(1, heroHeight)
      progressRef.current = Math.max(0, Math.min(1, raw))
    }

    update()
    scroller.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      scroller.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return progressRef
}
