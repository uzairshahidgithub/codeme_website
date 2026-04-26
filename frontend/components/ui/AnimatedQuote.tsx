'use client'

import { useState, useEffect, useRef } from 'react'

const DEFAULT_QUOTES = [
  'Your career is your worth',
  'Skills Matter Most',
  'Build What the World Needs',
  'Code with Purpose',
]

const QUOTES_STORAGE_KEY = 'codemo-dev-quotes'
const MOTION_CONFIG_KEY  = 'codemo-dev-motion'

interface MotionConfig {
  transitionMs: number
  intervalMs: number
  motionPx: number
  fontWeight: number
  sizeMin: number
  sizeMax: number
  enabled: boolean
}

const DEFAULT_MOTION: MotionConfig = {
  transitionMs: 700,
  intervalMs:   4000,
  motionPx:     20,
  fontWeight:   300,
  sizeMin:      20,
  sizeMax:      48,
  enabled:      true,
}

function loadQuotes(): string[] {
  if (typeof window === 'undefined') return DEFAULT_QUOTES
  try {
    const raw = localStorage.getItem(QUOTES_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return DEFAULT_QUOTES
}

function loadMotion(): MotionConfig {
  if (typeof window === 'undefined') return DEFAULT_MOTION
  try {
    const raw = localStorage.getItem(MOTION_CONFIG_KEY)
    if (raw) return { ...DEFAULT_MOTION, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_MOTION
}

// Phase: 'in' = entering, 'hold' = visible, 'out' = exiting
type Phase = 'in' | 'hold' | 'out'

export function AnimatedQuote() {
  const [quotes,  setQuotes]  = useState<string[]>(DEFAULT_QUOTES)
  const [motion,  setMotion]  = useState<MotionConfig>(DEFAULT_MOTION)
  const [index,   setIndex]   = useState(0)
  const [phase,   setPhase]   = useState<Phase>('in')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from localStorage on mount and when storage changes
  useEffect(() => {
    setQuotes(loadQuotes())
    setMotion(loadMotion())

    function onStorage(e: StorageEvent) {
      if (e.key === QUOTES_STORAGE_KEY) setQuotes(loadQuotes())
      if (e.key === MOTION_CONFIG_KEY)  setMotion(loadMotion())
    }
    // Also listen for custom event dispatched by the same tab's dev panel
    function onDevUpdate() {
      setQuotes(loadQuotes())
      setMotion(loadMotion())
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('codemo-dev-update', onDevUpdate)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('codemo-dev-update', onDevUpdate)
    }
  }, [])

  // Animation state machine
  useEffect(() => {
    if (!motion.enabled || quotes.length <= 1) return

    const clear = () => { if (timerRef.current) clearTimeout(timerRef.current) }

    if (phase === 'in') {
      // after transition-in completes → hold
      timerRef.current = setTimeout(() => setPhase('hold'), motion.transitionMs)
    } else if (phase === 'hold') {
      // hold for interval then start exit
      timerRef.current = setTimeout(() => setPhase('out'), motion.intervalMs)
    } else if (phase === 'out') {
      // after transition-out → advance index, restart
      timerRef.current = setTimeout(() => {
        setIndex(i => (i + 1) % quotes.length)
        setPhase('in')
      }, motion.transitionMs)
    }

    return clear
  }, [phase, motion, quotes])

  const { transitionMs, motionPx, fontWeight, sizeMin, sizeMax, enabled } = motion

  // Inline styles for the three animation phases
  const styleMap: Record<Phase, React.CSSProperties> = {
    in:   { opacity: 1, transform: 'translateY(0px)' },
    hold: { opacity: 1, transform: 'translateY(0px)' },
    out:  { opacity: 0, transform: `translateY(-${motionPx}px)` },
  }

  // When entering, we start from the offset-down invisible state
  // We achieve this by applying the 'in' end-state but the transition starts
  // from an initial 'offscreen' state injected via CSS class
  const easing = 'cubic-bezier(0, 0, 0, 1)'
  const transition = `opacity ${transitionMs}ms ${easing}, transform ${transitionMs}ms ${easing}`

  const currentStyle: React.CSSProperties = {
    ...styleMap[phase],
    transition,
  }

  const text = quotes[index] ?? ''

  function renderQuote(q: string) {
    if (q.toLowerCase() === 'your career is your worth') {
      return (
        <>
          <span style={{ fontWeight: 300 }}>Your </span>
          <span style={{ fontWeight: 700 }}>career</span>
          <span style={{ fontWeight: 300 }}> is your </span>
          <span style={{ fontWeight: 700 }}>worth</span>
        </>
      )
    }
    return q
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600&display=swap');

        .animated-quote-wrap {
          display: none;
        }

        @media (min-width: 1024px) {
          .animated-quote-wrap {
            display: flex !important;
            justify-content: flex-start;
            text-align: left;
            padding: 0;
            color: var(--text1, #f0f0f0);
            line-height: 1.1;
            letter-spacing: -0.02em;
            /* Animation base */
            opacity: 0;
            transform: translateY(20px);
            /* Layout */
            position: relative;
            width: 100%;
            margin-bottom: 0;
            /* Desktop Typography */
            font-family: 'Segoe UI Variable Display', 'Segoe UI Variable', 'Segoe UI', Poppins, sans-serif;
            font-weight: var(--auth-quote-weight, 300);
            font-size: var(--auth-quote-size, 48px);
          }
        }

      `}</style>

      <div
        className="animated-quote-wrap"
        style={enabled ? currentStyle : {}}
      >
        {text}
      </div>
    </>
  )
}
