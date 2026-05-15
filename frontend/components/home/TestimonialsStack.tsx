'use client'

import { useEffect, useState } from 'react'

export interface TestimonialItem {
  id: string
  name: string
  role: string | null
  content: string
  rating: number
  avatar_url?: string | null
}

interface Props {
  items: TestimonialItem[]
}

const AUTOPLAY_MS = 5500

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="m12 3 2.7 5.7L21 9.6l-4.6 4.3 1.2 6.1L12 17.3 6.4 20l1.2-6.1L3 9.6l6.3-.9z"/>
    </svg>
  )
}
function ChevIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}

function initialsFor(name: string): string {
  return name.split(' ').map((s) => s[0] ?? '').join('').slice(0, 2).toUpperCase()
}

export function TestimonialsStack({ items }: Props) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = items.length

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (paused || n < 2) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % n), AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [paused, n])

  if (n === 0) return null

  // Compute relative position vs active for each card.
  // -1 → behind-left, 0 → front, 1 → behind-right, others → hidden.
  function relPos(i: number): number {
    const diff = ((i - active + n) % n)
    if (diff === 0) return 0
    if (diff === 1) return 1
    if (diff === n - 1) return -1
    return 2 // hidden
  }

  return (
    <div
      className="testi-stack"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="testi-stage" aria-roledescription="carousel">
        {items.map((t, i) => {
          const pos = relPos(i)
          const visible = pos !== 2
          const isFront = pos === 0
          const transform =
            pos === 0 ? 'translateX(0) scale(1)   rotate(0deg)' :
            pos === -1 ? 'translateX(-58%) scale(0.86) rotate(-6deg)' :
            pos === 1  ? 'translateX(58%)  scale(0.86) rotate(6deg)'  :
            'translateX(0) scale(0.7) rotate(0deg)'
          return (
            <article
              key={t.id}
              className="testi-deck-card"
              aria-hidden={!isFront}
              style={{
                transform,
                opacity: visible ? (isFront ? 1 : 0.55) : 0,
                zIndex: isFront ? 3 : 1,
                pointerEvents: isFront ? 'auto' : 'none',
                filter: isFront ? 'none' : 'blur(0.4px)',
              }}
            >
              <div className="stars" aria-label={`Rated ${t.rating} out of 5`}>
                {Array.from({ length: t.rating }).map((_, k) => <StarIcon key={k} />)}
              </div>
              <p className="testi-quote">{t.content}</p>
              <div className="testi-author">
                <div className="avatar testi-avatar-lg">
                  {t.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={t.avatar_url} alt="" />
                  ) : initialsFor(t.name)}
                </div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  {t.role && <div className="testi-role">{t.role}</div>}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {n > 1 && (
        <div className="testi-controls">
          <button type="button" className="testi-nav" aria-label="Previous testimonial"
                  onClick={() => setActive((i) => (i - 1 + n) % n)}>
            <ChevIcon dir="left" />
          </button>
          <div className="testi-dots" role="tablist" aria-label="Testimonial selector">
            {items.map((_, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === active}
                      aria-label={`Show testimonial ${i + 1}`}
                      className={`testi-dot ${i === active ? 'is-active' : ''}`}
                      onClick={() => setActive(i)} />
            ))}
          </div>
          <button type="button" className="testi-nav" aria-label="Next testimonial"
                  onClick={() => setActive((i) => (i + 1) % n)}>
            <ChevIcon dir="right" />
          </button>
        </div>
      )}
    </div>
  )
}
