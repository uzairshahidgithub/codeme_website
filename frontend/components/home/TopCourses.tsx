'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Pencil, Play } from 'lucide-react'
import { useState } from 'react'

export interface CourseItem {
  id: string
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
  instructor_name: string
  duration_hours: number
  enrolled_count: number
  thumbnail_url?: string | null
  tags?: string[] | null
  description?: string | null
}

interface Props {
  items: CourseItem[]
  isAdmin?: boolean
}

const WHEEL_SPRING = { type: 'spring' as const, damping: 20, stiffness: 100 }
const BG_FADE = { duration: 0.7, ease: 'easeOut' as const }
const COPY_FADE = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }

function deriveTags(item: CourseItem): string[] {
  if (item.tags && item.tags.length > 0) return item.tags.slice(0, 3)
  return [
    item.level === 'beginner'
      ? 'Foundations'
      : item.level === 'intermediate'
        ? 'Intermediate'
        : 'Advanced',
  ]
}

function deriveDescription(item: CourseItem): string {
  if (item.description) return item.description
  const topics = item.tags?.slice(0, 2).join(' · ') ?? item.level
  return `An ${item.level}-level deep dive led by ${item.instructor_name}. ${item.duration_hours} focused hours covering ${topics}, built for engineers who want to ship — not just watch.`
}

export function TopCourses({ items, isAdmin = false }: Props) {
  const top = items.slice(0, 5)
  const [activeIndex, setActiveIndex] = useState(0)
  if (top.length === 0) return null

  const current = top[activeIndex]
  const rank = String(activeIndex + 1).padStart(2, '0')
  const tags = deriveTags(current)
  const description = deriveDescription(current)

  return (
    <section
      aria-label="Top 5 courses this week"
      className="
        relative overflow-hidden w-full min-h-[600px] lg:min-h-[640px]
        flex items-center
        rounded-3xl
        bg-white dark:bg-[#0A0A0A]
        border border-gray-200 dark:border-white/[0.06]
      "
    >
      {/* ============== IMMERSIVE BACKGROUND ============== */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <AnimatePresence mode="sync">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={BG_FADE}
            className="absolute inset-0"
          >
            {current.thumbnail_url ? (
              <Image
                src={current.thumbnail_url}
                alt=""
                fill
                sizes="100vw"
                className="object-cover opacity-30 dark:opacity-20 blur-2xl"
                priority={false}
              />
            ) : (
              <div className="absolute inset-0 mesh-gradient opacity-80 dark:opacity-90 blur-2xl" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Readability mask — horizontal on desktop, vertical on mobile */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-b lg:bg-gradient-to-r
            from-white via-white/95 to-white/40
            dark:from-[#0A0A0A] dark:via-[#0A0A0A]/90 dark:to-[#0A0A0A]/40
          "
        />
      </div>

      {/* ============== CONTENT ============== */}
      <div
        className="
          relative z-10 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-8
          w-full px-6 md:px-10 lg:px-16 py-16 md:py-20
        "
      >
        {/* ---------- LEFT — Content & CTA ---------- */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={COPY_FADE}
            >
              {/* Glassmorphic badge: "01 — BEGINNER" */}
              <span
                className="
                  inline-flex items-center gap-2.5
                  px-3.5 py-1.5 rounded-full
                  bg-white/40 dark:bg-white/[0.06]
                  backdrop-blur-md
                  border border-gray-200/70 dark:border-white/[0.08]
                  text-[11px] font-semibold uppercase tracking-[0.18em]
                  text-gray-700 dark:text-gray-200
                "
              >
                <span className="font-mono">{rank}</span>
                <span aria-hidden="true" className="h-3 w-px bg-gray-400/60 dark:bg-white/15" />
                <span>{current.level}</span>
              </span>

              {/* Massive sharp title */}
              <h3
                className="
                  mt-6 mb-4
                  text-4xl sm:text-5xl lg:text-6xl
                  font-bold tracking-tighter leading-[1.02]
                  text-gray-900 dark:text-white
                "
              >
                {current.title}
              </h3>

              {/* Description */}
              <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-xl leading-relaxed mb-8">
                {description}
              </p>

              {/* Tag dots */}
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5 mb-10">
                {tags.map((tag) => (
                  <li key={tag} className="flex items-center gap-2">
                    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Premium CTA + meta + admin */}
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href="/eduto"
                  aria-label={`Enroll in ${current.title}`}
                  className="
                    inline-flex items-center gap-2 min-h-[44px]
                    bg-blue-600 hover:bg-blue-500 text-white
                    px-7 lg:px-8 py-3.5 lg:py-4
                    rounded-full font-semibold
                    transition-all duration-200
                    shadow-[0_0_20px_rgba(37,99,235,0.3)]
                    hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]
                    hover:-translate-y-0.5
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0A0A0A]
                  "
                >
                  Enroll Now
                  <ArrowRight size={18} strokeWidth={2} />
                </Link>

                <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-500">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {current.enrolled_count.toLocaleString()} enrolled · {current.duration_hours}h
                </span>

                {isAdmin && (
                  <Link
                    href={`/admin/courses/${current.id}`}
                    aria-label={`Edit ${current.title}`}
                    className="
                      inline-flex h-11 w-11 items-center justify-center rounded-full
                      border border-gray-200 dark:border-white/[0.08]
                      text-gray-500 dark:text-gray-400
                      hover:text-blue-600 dark:hover:text-blue-400
                      hover:border-blue-500/40
                      transition-colors
                    "
                  >
                    <Pencil size={16} strokeWidth={1.6} />
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ---------- RIGHT — Orbital half-wheel (desktop ≥ lg) ---------- */}
        <ul
          role="listbox"
          aria-label="Course playlist"
          className="hidden lg:flex flex-col items-stretch justify-center gap-3 self-center"
          style={{ perspective: '1200px' }}
        >
          {top.map((c, i) => {
            const delta = i - activeIndex
            const absDelta = Math.abs(delta)
            const isActive = i === activeIndex

            // Wheel mapping — distance from active drives scale/opacity/x-offset
            let scale = 0.7
            let opacity = 0.15
            let x = 80
            if (absDelta === 0) { scale = 1; opacity = 1; x = 0 }
            else if (absDelta === 1) { scale = 0.85; opacity = 0.4; x = 40 }

            const rankNum = String(i + 1).padStart(2, '0')

            return (
              <motion.li
                key={c.id}
                layout
                animate={{ scale, opacity, x }}
                transition={WHEEL_SPRING}
                style={{ transformOrigin: 'right center' }}
                className="list-none will-change-transform"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => setActiveIndex(i)}
                  className={[
                    'group/row w-full flex items-center gap-4 text-left',
                    'py-4 pl-5 pr-3 rounded-2xl min-h-[64px]',
                    'transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isActive
                      ? 'bg-white/60 dark:bg-white/[0.04] backdrop-blur-md border border-gray-200/70 dark:border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
                      : 'hover:bg-white/40 dark:hover:bg-white/[0.025]',
                  ].join(' ')}
                >
                  {/* Mono numeral — stroked outline when inactive, solid blue when active */}
                  <span
                    aria-hidden="true"
                    className={[
                      'font-mono italic font-black leading-none shrink-0 select-none',
                      'text-2xl tabular-nums tracking-tight',
                      'transition-colors duration-200',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-transparent [-webkit-text-stroke:1px_rgba(120,120,120,0.55)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.45)]',
                    ].join(' ')}
                  >
                    {rankNum}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span
                      className={[
                        'block text-[15px] font-semibold truncate transition-colors',
                        isActive
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-400 group-hover/row:text-gray-900 dark:group-hover/row:text-white',
                      ].join(' ')}
                    >
                      {c.title}
                    </span>
                    <span className="block mt-0.5 text-xs text-gray-500 dark:text-gray-500 truncate">
                      {c.instructor_name} · {c.duration_hours}h
                    </span>
                  </span>

                  {/* Selection indicator — animates between active rows via shared layoutId */}
                  {isActive && (
                    <motion.span
                      layoutId="wheel-active-indicator"
                      transition={WHEEL_SPRING}
                      className="
                        inline-flex h-9 w-9 items-center justify-center rounded-full
                        bg-blue-600 text-white shrink-0
                        shadow-[0_0_18px_rgba(37,99,235,0.45)]
                      "
                    >
                      <Play size={13} strokeWidth={2} fill="currentColor" />
                    </motion.span>
                  )}
                </button>
              </motion.li>
            )
          })}
        </ul>

        {/* ---------- RIGHT (Mobile / Tablet < lg) — horizontal CSS scroll-snap rail ---------- */}
        <ul
          role="listbox"
          aria-label="Course playlist"
          className="
            lg:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar
            gap-3 -mx-6 md:-mx-10 px-6 md:px-10 pb-2
          "
        >
          {top.map((c, i) => {
            const isActive = i === activeIndex
            const rankNum = String(i + 1).padStart(2, '0')
            return (
              <li
                key={c.id}
                className="snap-center shrink-0 w-[78vw] max-w-[320px] list-none"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => setActiveIndex(i)}
                  className={[
                    'w-full flex items-center gap-3 text-left min-h-[64px]',
                    'py-4 px-4 rounded-2xl',
                    'border transition-colors duration-200',
                    isActive
                      ? 'bg-white dark:bg-white/[0.05] border-blue-500/40 dark:border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.18)]'
                      : 'bg-white/70 dark:bg-white/[0.02] border-gray-200 dark:border-white/[0.06]',
                  ].join(' ')}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      'font-mono italic font-black leading-none text-2xl tabular-nums tracking-tight shrink-0',
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-transparent [-webkit-text-stroke:1px_rgba(120,120,120,0.55)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.4)]',
                    ].join(' ')}
                  >
                    {rankNum}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={[
                        'block text-sm font-semibold truncate',
                        isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300',
                      ].join(' ')}
                    >
                      {c.title}
                    </span>
                    <span className="block mt-0.5 text-[11px] text-gray-500 dark:text-gray-500 truncate">
                      {c.instructor_name} · {c.duration_hours}h
                    </span>
                  </span>
                  {isActive && (
                    <Play
                      size={14}
                      strokeWidth={2}
                      fill="currentColor"
                      className="text-blue-600 dark:text-blue-400 shrink-0"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
