'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface CourseItem {
  id: string
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
  instructor_name: string
  duration_hours: number
  enrolled_count: number
  thumbnail_url?: string | null
}

interface Props {
  items: CourseItem[]
}

const LEVEL_CLASS: Record<CourseItem['level'], string> = {
  beginner:     'level-sage',
  intermediate: 'level-gold',
  advanced:     'level-ink',
}

const FADE_MS = 360

function ChevIcon({ dir = 'right' }: { dir?: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8"/>
    </svg>
  )
}

export function CourseStack({ items }: Props) {
  const [active, setActive] = useState(0)
  const n = items.length
  if (n === 0) return null

  function go(delta: 1 | -1) {
    setActive((i) => (i + delta + n) % n)
  }

  const front = items[active]

  return (
    <div className="course-slider">
      {/* Left — active cover + thumbnail strip showing every course */}
      <div className="course-slider-left">
        <div className="course-cover-wrap">
          <button
            key={`cover-${active}`}
            type="button"
            className="course-cover-flat course-slide-in"
            style={{ animationDuration: `${FADE_MS}ms` }}
            aria-label={front.title}
          >
            <div className="cover-art">
              <span className={`level ${LEVEL_CLASS[front.level]}`}>{front.level}</span>
              <div className="cover-stripes" />
              <div className="cover-title-flat">{front.title}</div>
              <div className="cover-author-flat">{front.instructor_name}</div>
            </div>
          </button>
        </div>

        <div className="course-slider-controls">
          <button type="button" className="course-nav-btn" aria-label="Previous course" onClick={() => go(-1)}>
            <ChevIcon dir="left" />
          </button>
          <span className="course-counter">{String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
          <button type="button" className="course-nav-btn" aria-label="Next course" onClick={() => go(1)}>
            <ChevIcon dir="right" />
          </button>
        </div>

        {/* Thumbnail strip — every course visible, never hidden */}
        <div className="course-thumbs" role="tablist" aria-label="All courses">
          {items.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={c.title}
              className={`course-thumb ${i === active ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              <span className={`course-thumb-dot ${LEVEL_CLASS[c.level]}`} />
              <span className="course-thumb-title">{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right — fade-in details */}
      <div className="course-slider-right" key={`detail-${active}`} style={{ animationDuration: `${FADE_MS}ms` }}>
        <div className="course-detail-meta">
          <span className={`level ${LEVEL_CLASS[front.level]}`}>{front.level}</span>
          <span className="course-meta-row"><ClockIcon /> {front.duration_hours}h</span>
          <span className="course-meta-row">· {front.enrolled_count.toLocaleString()} enrolled</span>
        </div>
        <h3 className="course-detail-title">{front.title}</h3>
        <div className="course-detail-instructor">By {front.instructor_name}</div>
        <p className="course-detail-blurb">
          A focused track inside Codemo eLearn. Practical lessons, real exercises, peer reviews from
          working engineers. Sit one module per evening or sprint the whole thing.
        </p>
        <div className="course-detail-actions">
          <Link href="/eduto" className="pill pill-primary pill-sm" aria-label={`Start the ${front.title} course`}>
            <span className="pill-icon"><ArrowIcon /></span>
            <span>Start learning</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
