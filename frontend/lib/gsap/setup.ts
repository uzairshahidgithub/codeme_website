// ─────────────────────────────────────
// GSAP GLOBAL SETUP
// Single registration point. Import from '@/lib/gsap/setup' across the app —
// never import gsap directly elsewhere. This guarantees ScrollTrigger
// registers exactly once and prevents duplicate-trigger bugs on hot reload.
// ─────────────────────────────────────

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// The app shell (frontend/app/(app)/layout.tsx) sets `body { overflow: hidden }`
// and scrolls inside <main id="main-content">. ScrollTrigger needs this scroller
// passed explicitly — window scroll never fires.
export const SCROLLER_ID = '#main-content'

let initialised = false

if (typeof window !== 'undefined' && !initialised) {
  gsap.registerPlugin(ScrollTrigger)
  gsap.defaults({ ease: 'power2.out' })
  ScrollTrigger.defaults({
    markers: false,                    // flip to true only when debugging
    scroller: SCROLLER_ID,
  })
  initialised = true
}

export { gsap, ScrollTrigger }
