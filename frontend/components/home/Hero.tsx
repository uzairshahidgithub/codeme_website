'use client'

import Link from 'next/link'
import { RotatingHeadline } from './RotatingHeadline'

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}
function ChevIcon({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}
function ScrollIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v14m-5-5 5 5 5-5" />
    </svg>
  )
}

export function Hero() {
  function scrollToNext() {
    const target = document.getElementById('home-stats')
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="hero-frame">
        <div className="hero-3d-canvas" aria-hidden="true">
          <div className="stage-stripes" />
          {/* Media slot reserved for future image/video background asset */}
          <div className="hero-media-slot" />
        </div>

        <div className="hero-copy py-24 md:py-32 lg:py-36 px-6 md:px-8">
          <div className="hero-rise" style={{ animationDelay: '0ms' }}>
            <RotatingHeadline />
          </div>

          <p
            className="
              hero-rise hero-sub
              !mt-8 md:!mt-10
              text-base md:text-lg
              !text-gray-600 dark:!text-gray-400
              max-w-2xl mx-auto leading-relaxed !font-normal
            "
            style={{ animationDelay: '140ms' }}
          >
            Structured Discord channels, real tutorials, real career support — built by
            engineers who&apos;ve shipped, for engineers who are starting.
          </p>

          <div
            className="hero-rise flex flex-wrap items-center justify-center gap-3 mt-10 md:mt-12"
            style={{ animationDelay: '280ms' }}
          >
            <Link
              href="/team"
              className="
                inline-flex items-center gap-2
                min-h-[44px] px-5 md:px-6
                rounded-full bg-blue-600 text-white text-sm md:text-[15px] font-medium
                shadow-[0_10px_32px_rgba(26,72,254,0.35)]
                hover:bg-blue-500 hover:-translate-y-0.5
                transition-all duration-200
              "
            >
              Open community
              <ArrowIcon size={14} />
            </Link>
            <Link
              href="/eduto"
              className="
                inline-flex items-center gap-2
                min-h-[44px] px-5 md:px-6
                rounded-full
                bg-white/70 dark:bg-white/[0.04]
                border border-gray-300 dark:border-white/10
                text-gray-900 dark:text-white
                text-sm md:text-[15px] font-medium
                backdrop-blur-md
                hover:bg-white dark:hover:bg-white/[0.08]
                hover:border-gray-400 dark:hover:border-white/20
                transition-colors duration-200
              "
            >
              Browse courses
              <ChevIcon size={13} />
            </Link>
          </div>
        </div>

        <aside className="glass-card">
          <div>
            <div className="kpi">12.4K</div>
            <div className="kpi-label">Active members</div>
          </div>
          <Link href="/team" className="white-pill">
            <span className="white-pill-icon"><ArrowIcon size={13} /></span>
            <span>Open community</span>
          </Link>
        </aside>

        <Link href="/eduto" className="carved" aria-label="Browse the courses library">
          <div className="carved-icon"><ArrowIcon size={22} /></div>
          <div>
            <div className="carved-title">Courses</div>
            <div className="carved-sub">Library <ChevIcon size={11} /></div>
          </div>
        </Link>

        <button type="button" className="scroll-hint" onClick={scrollToNext} aria-label="Scroll to stats">
          <ScrollIcon size={18} />
        </button>
      </div>
    </section>
  )
}
