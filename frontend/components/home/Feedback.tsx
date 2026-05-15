'use client'

import { useEffect, useRef, useState } from 'react'

export interface FeedbackItem {
  id: string
  name: string
  role: string | null
  content: string
  rating: number
  avatar_url?: string | null
}

interface Props {
  items: FeedbackItem[]
}

const AUTOPLAY_MS = 6000

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3 2.7 5.7L21 9.6l-4.6 4.3 1.2 6.1L12 17.3 6.4 20l1.2-6.1L3 9.6l6.3-.9z" />
    </svg>
  )
}

function ChevIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}

function initialsFor(name: string): string {
  return name
    .split(' ')
    .map((s) => s[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Card({ item, active }: { item: FeedbackItem; active: boolean }) {
  return (
    <article
      aria-hidden={!active}
      className={[
        'flex flex-col h-full p-7 md:p-8 rounded-2xl',
        'bg-white dark:bg-[#141414]',
        'border transition-all duration-300 ease-in-out',
        active
          ? 'border-blue-600/40 dark:border-blue-500/40 shadow-[0_18px_48px_-12px_rgba(26,72,254,0.18)] dark:shadow-[0_18px_48px_-12px_rgba(26,72,254,0.35)]'
          : 'border-gray-200 dark:border-white/[0.06] opacity-60 dark:opacity-55 shadow-none',
      ].join(' ')}
    >
      <header className="flex flex-row items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={[
              'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden',
              'transition-colors',
              active
                ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-600/20 dark:border-blue-500/25'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/[0.06]',
            ].join(' ')}
          >
            {item.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="text-[13px] font-semibold tracking-wide">{initialsFor(item.name)}</span>
            )}
          </span>
          <div className="min-w-0">
            <div
              className={[
                'text-[15px] font-semibold leading-tight truncate transition-colors',
                active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
              ].join(' ')}
            >
              {item.name}
            </div>
            {item.role && (
              <div className="text-[12.5px] mt-0.5 truncate text-gray-500 dark:text-gray-500">
                {item.role}
              </div>
            )}
          </div>
        </div>
        <div
          className={[
            'flex items-center gap-0.5 shrink-0 transition-colors',
            active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-700',
          ].join(' ')}
          aria-label={`Rated ${item.rating} out of 5`}
        >
          {Array.from({ length: 5 }).map((_, k) => (
            <StarIcon key={k} filled={k < item.rating} />
          ))}
        </div>
      </header>
      <p className="text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 font-normal">
        {item.content}
      </p>
    </article>
  )
}

export function Feedback({ items }: Props) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)
  const n = items.length

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (paused || n < 2) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % n), AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [paused, n])

  // Track active card on mobile via scroll-snap intersection
  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    if (typeof IntersectionObserver === 'undefined') return
    const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-fb-card]'))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number(entry.target.getAttribute('data-fb-index'))
            if (!Number.isNaN(idx)) setActive(idx)
          }
        })
      },
      { root: rail, threshold: [0.6] },
    )
    cards.forEach((card) => io.observe(card))
    return () => io.disconnect()
  }, [n])

  if (n === 0) return null

  const prevIdx = (active - 1 + n) % n
  const nextIdx = (active + 1) % n
  const go = (delta: 1 | -1) => setActive((i) => (i + delta + n) % n)

  return (
    <div
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Desktop ≥1024: 3-card row, center prominent, sides dimmed */}
      <div className="hidden lg:grid grid-cols-3 items-stretch gap-6 max-w-[1120px] mx-auto px-6">
        <Card item={items[prevIdx]} active={false} />
        <Card item={items[active]} active={true} />
        <Card item={items[nextIdx]} active={false} />
      </div>

      {/* Mobile / tablet <1024: fluid horizontal scroll-snap rail */}
      <div
        ref={railRef}
        className="
          lg:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar
          gap-4 px-6 -mx-6 pb-2
        "
        style={{ scrollPaddingInline: '24px' }}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            data-fb-card
            data-fb-index={i}
            className="snap-center shrink-0 min-w-[85vw] max-w-md"
          >
            <Card item={item} active={i === active} />
          </div>
        ))}
      </div>

      {/* Controls */}
      {n > 1 && (
        <div className="mt-8 flex items-center justify-center gap-5 px-6">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous feedback"
            className="
              inline-flex items-center justify-center
              min-h-[44px] min-w-[44px] rounded-full
              bg-white dark:bg-white/[0.04]
              border border-gray-200 dark:border-white/10
              text-gray-600 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-white/[0.08]
              hover:text-gray-900 dark:hover:text-white
              transition-colors duration-200
            "
          >
            <ChevIcon dir="left" />
          </button>

          <div className="flex items-center gap-2.5" role="tablist" aria-label="Feedback selector">
            {items.map((_, i) => {
              const isActive = i === active
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Show feedback ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={[
                    'h-2 rounded-full transition-all duration-200',
                    isActive
                      ? 'w-7 bg-blue-600 dark:bg-blue-500'
                      : 'w-2 bg-gray-300 dark:bg-white/15 hover:bg-gray-400 dark:hover:bg-white/25',
                  ].join(' ')}
                />
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next feedback"
            className="
              inline-flex items-center justify-center
              min-h-[44px] min-w-[44px] rounded-full
              bg-white dark:bg-white/[0.04]
              border border-gray-200 dark:border-white/10
              text-gray-600 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-white/[0.08]
              hover:text-gray-900 dark:hover:text-white
              transition-colors duration-200
            "
          >
            <ChevIcon dir="right" />
          </button>
        </div>
      )}
    </div>
  )
}
