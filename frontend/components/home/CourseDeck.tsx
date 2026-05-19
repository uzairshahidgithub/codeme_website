'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState } from 'react'
import {
  motion,
  animate,
  useMotionValue,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useMainScrollContainer } from '@/lib/useMainScrollContainer'
import { cn } from '@/lib/utils'
import type { CourseItem } from './CourseHighlights'

interface Props {
  courses: CourseItem[]
}

/* ────────────────────────────────────────────────────────────
   CourseDeck — pinned paper-stack scrubber.

   Layout (desktop, ≥ md):
     • Sticky container fills the viewport (h-screen).
     • Flex-column: header at the top, stage (`flex-1`) fills
       the rest — so the cards always sit BELOW the header
       and CENTRED in the remaining space.
     • Each card lives inside its own absolute flex-centring
       shell. Framer Motion's `x/y` transforms apply on top of
       that centering, so motion never fights Tailwind's
       `-translate-x-1/2` (which it would otherwise overwrite).
     • Cards are medium-sized (clamp 300–500 px wide) so the
       entire fan is visible on standard desktops.

   Behaviour:
     • All cards start fanned to the left like a paper stack.
     • As the user scrolls down, the front card deals OFF to
       the right; the next card animates forward.
     • One card per scroll slice. After the last card deals,
       the sticky releases and the next section follows.
   ────────────────────────────────────────────────────────── */

const COVER_PALETTES = [
  ['#1a48fe', '#0F1A36'],
  ['#F5A524', '#5A3500'],
  ['#FF6F61', '#5C1A14'],
  ['#84CC16', '#1C2F08'],
  ['#8B7BFF', '#2A1F66'],
  ['#0EA5E9', '#0C2A3A'],
] as const

function hashOf(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
function paletteFor(id: string): readonly [string, string] {
  return COVER_PALETTES[hashOf(id) % COVER_PALETTES.length]
}

function ArrowSvg({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

/* ─── Single card face ──────────────────────────────────────── */

function CardFace({ c }: { c: CourseItem }) {
  const [a, b] = paletteFor(c.id)
  return (
    <article className="
      relative w-full h-full overflow-hidden
      rounded-[22px]
      bg-bg-surface ring-1 ring-border-subtle
      flex flex-col
    ">
      {/* Cover */}
      <div className="relative w-full aspect-[16/10] overflow-hidden shrink-0">
        {c.thumbnail_url ? (
          <Image
            src={c.thumbnail_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, 70vw"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(155deg, ${a} 0%, ${b} 100%)` }}
          />
        )}

        {/* Decorative thin ring */}
        <svg viewBox="0 0 360 224" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-80">
          <g stroke="rgba(255,255,255,0.12)" fill="none">
            <circle cx="290" cy="44" r="36" />
            <circle cx="290" cy="44" r="60" />
          </g>
        </svg>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-14"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}
        />

        <span className="
          absolute top-2.5 right-2.5 inline-flex items-center
          px-2 py-0.5 rounded-md text-[10.5px] font-medium tabular-nums
          text-white bg-black/45 backdrop-blur-md
        ">
          {c.duration_hours}h
        </span>
      </div>

      {/* Meta */}
      <div className="relative flex-1 flex flex-col gap-2.5 px-6 py-5 md:px-7 md:py-6">
        <span className="text-[10.5px] uppercase tracking-[0.22em] font-medium text-text-tertiary">
          {c.level}
        </span>
        <h3
          className="font-sans font-medium text-text-primary leading-[1.18] tracking-[-0.02em] line-clamp-2"
          style={{ fontSize: 'clamp(17px, 1.5vw, 22px)' }}
        >
          {c.title}
        </h3>
        {c.description && (
          <p
            className="text-text-secondary font-light line-clamp-2 leading-[1.5] max-w-[44ch]"
            style={{ fontSize: 'clamp(12.5px, 0.95vw, 14px)' }}
          >
            {c.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-text-primary truncate">{c.instructor_name}</div>
            <div className="text-[10.5px] text-text-tertiary mt-0.5 tabular-nums">
              {Intl.NumberFormat('en', { notation: 'compact' }).format(c.enrolled_count)} learners
            </div>
          </div>
          <Link
            href="/eduto"
            className="
              inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
              text-[12.5px] font-medium text-white
              transition-transform duration-200 hover:-translate-y-0.5
              shrink-0
            "
            style={{
              background: 'var(--blue)',
              boxShadow: '0 8px 18px -10px color-mix(in oklab, var(--blue) 60%, transparent)',
            }}
          >
            Start <ArrowSvg />
          </Link>
        </div>
      </div>
    </article>
  )
}

/* ─── Choreography knobs ─────────────────────────────────────
   Single source of truth for every timing the deck derives
   (StackCard transforms, Dot timing, section height). All
   values are in "card-slot" units; one card slot is 1.0.

   Flow (in normalised scroll progress):
     0 ───── LEAD_IN ───── deal 0 → deal 1 → … → deal n-2 ───── TAIL ───── 1
     pin             apex hand-off cycle             last card sits at apex, held

   • LEAD_IN — the wait after the section pins. Cards sit
     in the fanned stack while the user is "settling in"
     to the locked section.
   • DEAL_DURATION — how much of one slot is the actual
     deal-off animation for a given card (the remainder of
     the slot is the apex pause for the next card).
   • TAIL — the held window at the end where the LAST card
     sits at apex before the section unlocks for the next
     home section. This is what makes the deck feel like it
     "lands" rather than emptying out. */
const LEAD_IN = 1.0
const DEAL_DURATION = 0.8
const TAIL = 0.7

function getSlice(total: number): number {
  return 1 / (total + LEAD_IN + TAIL)
}

/* ─── Scroll-driven paper-stack card ─────────────────────────
   Each card sits inside an absolute flex-centred shell so the
   Tailwind centering can't be overwritten by framer-motion's
   transform. The motion values translate the card off the
   centre point.
   ────────────────────────────────────────────────────────── */

function StackCard({
  c,
  i,
  total,
  progress,
}: {
  c: CourseItem
  i: number
  total: number
  progress: MotionValue<number>
}) {
  const slice = getSlice(total)
  /* Card "deals" between dealStart and dealEnd within its
     own slot. LEAD_IN shifts every card's start so the deck
     has a settle period at the top. */
  const dealStart = (i + LEAD_IN) * slice
  const dealEnd = (i + LEAD_IN + DEAL_DURATION) * slice

  /* Fan timeline — card slides in from its fanned-left
     position to the apex DURING the previous card's deal
     window. This is critical: it means during the LEAD_IN
     period (progress 0 → LEAD_IN * slice) NOTHING animates,
     so the user gets the "wait after pin" beat they asked
     for. Card 0 needs no fan — it's already the apex at
     start. */
  const fanStart = i === 0 ? 0 : (i - 1 + LEAD_IN) * slice
  const fanEnd = i === 0 ? 0 : (i - 1 + LEAD_IN + DEAL_DURATION) * slice

  // Tight fan so cards read as a real condensed paper stack.
  const FAN_X = 12    // px offset per layer
  const FAN_Y = 4     // px lift per layer
  const FAN_R = 0.9   // deg per layer
  const FAN_S = 0.022 // scale step per layer

  /* The LAST card is the hero of this section — it animates
     into the apex like every other card, then STAYS there.
     `isLast` keeps its deal range as no-ops so the stage
     never goes empty before the section unlocks. */
  const isLast = i === total - 1

  // X — fan slightly to the LEFT, then deal off to the RIGHT
  // (last card stays at apex through the deal window).
  const x = useTransform(
    progress,
    [fanStart, fanEnd, dealStart, dealEnd],
    isLast
      ? [`${-FAN_X * i}px`, '0px', '0px', '0px']
      : [`${-FAN_X * i}px`, '0px', '0px', '110vw'],
  )

  // Stair the stack so it reads physical.
  const y = useTransform(
    progress,
    [fanStart, fanEnd, dealStart, dealEnd],
    isLast
      ? [`${-FAN_Y * i}px`, '0px', '0px', '0px']
      : [`${-FAN_Y * i}px`, '0px', '0px', '-28px'],
  )

  const rotate = useTransform(
    progress,
    [fanStart, fanEnd, dealStart, dealEnd],
    isLast ? [-FAN_R * i, 0, 0, 0] : [-FAN_R * i, 0, 0, 8],
  )

  const scale = useTransform(
    progress,
    [fanStart, fanEnd, dealStart, dealEnd],
    isLast
      ? [Math.max(0.88, 1 - FAN_S * i), 1, 1, 1]
      : [Math.max(0.88, 1 - FAN_S * i), 1, 1, 0.95],
  )

  // Opacity — cards stay fully opaque in the stack (no
  // faint back cards). They only fade away once they're
  // being dealt off-stage. Last card never fades.
  const opacity = useTransform(
    progress,
    [dealStart, dealEnd - 0.001, dealEnd],
    isLast ? [1, 1, 1] : [1, 1, 0],
  )

  // Shadow — strongest at the apex, settles flat as cards
  // sit deeper in the stack so the depth still reads physical
  // even though every layer is at full opacity. Last card
  // holds its apex shadow through the tail so the resting
  // hero card reads grounded.
  const shadowOpacity = useTransform(
    progress,
    [fanStart, fanEnd, dealStart, dealEnd - 0.001, dealEnd],
    isLast
      ? [0.08, 0.30, 0.30, 0.30, 0.30]
      : [0.08 + (i === 0 ? 0.22 : 0), 0.30, 0.30, 0.20, 0],
  )
  const boxShadow = useTransform(
    shadowOpacity,
    (o) => `0 32px 60px -26px rgba(0, 0, 0, ${o}), 0 8px 20px -12px rgba(0, 0, 0, ${o * 0.55})`,
  )

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: total - i }}
    >
      <motion.div
        style={{ x, y, rotate, scale, opacity, boxShadow }}
        className="
          pointer-events-auto
          w-[min(92%,420px)]
          aspect-[3/4]
          max-h-[min(560px,72vh)]
          rounded-[22px]
          will-change-transform
        "
      >
        <CardFace c={c} />
      </motion.div>
    </div>
  )
}

/* ─── Progress dots ─────────────────────────────────────────── */

function Dot({ progress, i, total }: { progress: MotionValue<number>; i: number; total: number }) {
  const slice = getSlice(total)
  /* A dot is "active" while its card is the apex (visible).
     Card i becomes apex when the previous card finishes
     dealing (or at progress 0 for card 0); it stays apex
     until its own deal ends (or the section ends for the
     last card). The fill animation runs across a short
     window at the start so the dot snaps in cleanly. */
  const isLast = i === total - 1
  const apexStart = i === 0 ? 0 : (i - 1 + LEAD_IN + DEAL_DURATION) * slice
  const apexEnd = isLast ? 1 : (i + LEAD_IN + DEAL_DURATION) * slice
  const fillWindow = Math.min(apexEnd - apexStart, 0.05)
  const active = useTransform(progress, [apexStart, apexStart + fillWindow], [0, 1])
  const opacity = useTransform(active, [0, 1], [0.3, 1])
  const width = useTransform(active, [0, 1], [6, 18])
  return (
    <motion.span
      aria-hidden="true"
      style={{ opacity, width, background: 'var(--blue)' }}
      className="block h-1.5 rounded-full"
    />
  )
}

function ProgressDots({ progress, total }: { progress: MotionValue<number>; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} progress={progress} i={i} total={total} />
      ))}
    </div>
  )
}

export function CourseDeck({ courses }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const container = useMainScrollContainer()
  const { scrollYProgress } = useScroll({
    container,
    target: ref,
    offset: ['start start', 'end end'],
  })

  if (courses.length === 0) return null

  /* Per-card scroll budget. Sized from a single PER_CARD_VH
     constant + the choreography knobs (LEAD_IN + TAIL) so
     the deck section height ALWAYS matches the choreography
     defined above. Adjust PER_CARD_VH alone to make the deck
     feel tighter or looser overall. */
  const PER_CARD_VH = 60
  const totalSlots = courses.length + LEAD_IN + TAIL

  return (
    <section
      ref={ref}
      data-screen-label="03 Courses"
      style={{ height: `${totalSlots * PER_CARD_VH}vh` }}
      className="relative hidden md:block"
    >
      {/* Sticky theatre — two-column composition (Apple style):
          editorial title block on the LEFT, paper-stack on the RIGHT. */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Section ambient — soft blue glow biased toward the
            right where the deck sits */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(60% 55% at 75% 42%, color-mix(in oklab, var(--blue) 12%, transparent) 0%, transparent 70%)',
          }}
        />

        {/* Two-column grid lives inside the sticky and consumes
            the full viewport height. `isolate` keeps card transforms
            from ever bleeding into the headline column. Tighter
            gap (gap-6) gives the right column room for full-size
            cards on standard 1280–1440 px desktops. */}
        <div className="relative z-10 h-full mx-auto max-w-[1280px] px-6 md:px-10 grid grid-cols-12 gap-6 lg:gap-8 items-center isolate">

          {/* ── LEFT — editorial title block ───────────────── */}
          <div className="col-span-12 lg:col-span-5 self-center">
            <span
              className="text-text-tertiary uppercase tracking-[0.24em] font-medium block"
              style={{ fontSize: 'clamp(10px, 0.85vw, 12px)' }}
            >
              Eduto by Codemo
            </span>

            <h2 className="mt-4 font-sans font-semibold tracking-normal text-text-primary leading-[1.1] text-3xl md:text-5xl lg:text-6xl">
              A library you{' '}
              <span className="text-text-secondary">scroll through.</span>
            </h2>

            <p className="mt-5 max-w-[42ch] text-text-secondary font-normal text-base md:text-lg leading-[1.5]">
              Eduto is Codemo&apos;s open learning library — tracks built by working
              engineers, updated weekly, free to browse. Pick a path, scroll the
              deck, then dive in when you find the one that fits.
            </p>

            <div className="mt-7 flex items-center gap-5 flex-wrap">
              <Link
                href="/eduto"
                className="
                  group relative inline-flex items-center gap-2 pl-5 pr-1.5 py-1.5
                  rounded-full text-sm font-medium text-white overflow-hidden
                  transition-transform duration-300
                  shadow-[0_10px_24px_-12px_color-mix(in_oklab,var(--blue)_70%,transparent)]
                "
                style={{ background: 'var(--blue)' }}
              >
                <span className="relative">Open Eduto</span>
                <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15 backdrop-blur-md transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowSvg />
                </span>
              </Link>
              <Link
                href="/eduto"
                className="text-sm font-medium text-text-secondary hover:text-text-primary link-trail transition-colors"
              >
                Browse 340 tracks
              </Link>
            </div>
          </div>

          {/* ── RIGHT — card stage. Explicit clamp-height so the
              stack always fits inside the locked viewport, and the
              motion centring shells inherit it cleanly. ─────── */}
          <div
            className="col-span-12 lg:col-span-7 relative w-full"
            style={{ height: 'clamp(440px, 70vh, 620px)' }}
          >
            {/* Floor shadow under the apex card */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-[44%] h-9 rounded-full blur-3xl opacity-50"
              style={{ background: 'radial-gradient(ellipse, color-mix(in oklab, var(--blue) 26%, transparent), transparent 70%)' }}
            />

            {courses.map((c, i) => (
              <StackCard
                key={c.id}
                c={c}
                i={i}
                total={courses.length}
                progress={scrollYProgress}
              />
            ))}
          </div>
        </div>

        {/* Progress dots — pinned to the bottom of the sticky */}
        <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center">
          <ProgressDots progress={scrollYProgress} total={courses.length} />
        </div>
      </div>
    </section>
  )
}

/* ─── Mobile: touch-swipe deck ─────────────────────────────
   Completely different model from desktop: NO scroll pinning,
   NO sticky, NO 400vh budget. Just a normal-flow section
   with a Tinder-style draggable card stack.

   Rules from the brief:
     • Section sits in normal document flow — the page scrolls
       past it like any other section.
     • The top card responds to FINGER DRAG in any direction
       (left, right, up, down). Past a distance/velocity
       threshold it flies off-screen in the swipe direction
       and the next card becomes the apex.
     • If the user never touches the stack, NOTHING moves —
       cards stay perfectly still at their resting positions.
     • Desktop is untouched (the pinned CourseDeck above this
       file still runs at md+).
   ────────────────────────────────────────────────────────── */

interface SwipeCardProps {
  c: CourseItem
  depth: number       // 0 = top (interactive), 1 = next, 2 = back
  zIndex: number
  onDismiss: () => void
}

function SwipeCard({ c, depth, zIndex, onDismiss }: SwipeCardProps) {
  const isTop = depth === 0
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  // Light rotation tied to horizontal drag — gives the
  // physical card-flip feel without overdoing it.
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14])
  // Slight fade as the card is pulled far enough that the
  // user can tell it's about to fly off.
  const opacity = useTransform(
    [x, y] as unknown as MotionValue<number>,
    (latest) => {
      const arr = latest as unknown as number[]
      const xv = arr[0] ?? 0
      const yv = arr[1] ?? 0
      const dist = Math.sqrt(xv * xv + yv * yv)
      return Math.max(0.35, 1 - dist / 520)
    },
  )

  // Resting fan offsets MATCH the desktop deck so the stack
  // reads identical visually — cards peek slightly to the
  // LEFT with a tiny tilt and small scale shrink per layer.
  // Same magnitudes as desktop's StackCard (FAN_X=12,
  // FAN_Y=4, FAN_R=0.9°, FAN_S=0.022). Behaviour differs
  // (touch-swipe vs scroll-scrub) but the look does not.
  const RESTING_X = -12 * depth // negative = peek to LEFT (matches desktop)
  const RESTING_Y = -4 * depth  // tiny upward lift per layer
  const RESTING_ROTATE = -0.9 * depth
  const RESTING_SCALE = Math.max(0.88, 1 - 0.022 * depth)

  return (
    <motion.div
      drag={isTop ? true : false}
      dragElastic={0.65}
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        const offX = info.offset.x
        const offY = info.offset.y
        const dist = Math.sqrt(offX * offX + offY * offY)
        const vel = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2)

        // Threshold: any of (distance, velocity) clears the
        // bar means dismiss. Otherwise spring back to centre.
        if (dist > 110 || vel > 580) {
          const len = Math.max(dist, 1)
          // Throw the card in the direction of the swipe with
          // enough overshoot to clear the viewport regardless
          // of screen size.
          const w = typeof window !== 'undefined' ? window.innerWidth : 800
          const h = typeof window !== 'undefined' ? window.innerHeight : 1200
          const flyX = (offX / len) * Math.max(w, 800) * 1.4
          const flyY = (offY / len) * Math.max(h, 1200) * 1.4
          animate(x, flyX, { duration: 0.35, ease: [0.22, 1, 0.36, 1] })
          animate(y, flyY, { duration: 0.35, ease: [0.22, 1, 0.36, 1] })
          window.setTimeout(onDismiss, 320)
        } else {
          animate(x, 0, { type: 'spring', stiffness: 260, damping: 22 })
          animate(y, 0, { type: 'spring', stiffness: 260, damping: 22 })
        }
      }}
      style={{
        position: 'absolute',
        inset: 0,
        x: isTop ? x : RESTING_X,
        y: isTop ? y : RESTING_Y,
        rotate: isTop ? rotate : RESTING_ROTATE,
        scale: RESTING_SCALE,
        opacity: isTop ? opacity : 1,
        zIndex,
        touchAction: isTop ? 'none' : 'auto',
        cursor: isTop ? 'grab' : 'auto',
        // Same shadow language as desktop: heavier under the
        // apex card, lighter behind it so the depth reads
        // even without animation.
        boxShadow: isTop
          ? '0 32px 60px -26px rgba(0,0,0,0.34), 0 8px 20px -12px rgba(0,0,0,0.20)'
          : '0 18px 36px -22px rgba(0,0,0,0.26), 0 4px 12px -10px rgba(0,0,0,0.16)',
        willChange: 'transform',
      }}
      className="rounded-[22px]"
      whileTap={isTop ? { cursor: 'grabbing' } : undefined}
    >
      <CardFace c={c} />
    </motion.div>
  )
}

/* End-of-deck card. Once the user has swiped through every
   track, the apex slot is replaced by this CTA card that
   takes them into the full Eduto library. Same rounded
   corners + shadow as a regular SwipeCard so it slots into
   the stack visually. A small "Reshuffle" link below the
   primary CTA lets a curious user replay the deck. */
function BrowseMoreCard({ count, onReshuffle }: { count: number; onReshuffle: () => void }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center rounded-[22px] overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 0%, color-mix(in oklab, var(--blue) 22%, transparent) 0%, transparent 60%), var(--card-glass)',
        border: '1px solid var(--border)',
        boxShadow:
          '0 32px 60px -26px rgba(0,0,0,0.34), 0 8px 20px -12px rgba(0,0,0,0.20)',
      }}
    >
      {/* Decorative thin ring — matches the CardFace cover */}
      <svg
        viewBox="0 0 360 224"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-x-0 top-0 w-full h-[40%] opacity-60"
      >
        <g stroke="color-mix(in oklab, var(--blue) 32%, transparent)" fill="none">
          <circle cx="290" cy="44" r="36" />
          <circle cx="290" cy="44" r="60" />
        </g>
      </svg>

      <div className="relative z-[1] px-6 flex flex-col items-center gap-4">
        <span className="text-text-tertiary uppercase tracking-[0.22em] font-medium text-[10.5px]">
          That&apos;s the preview
        </span>
        <p className="font-sans font-medium text-text-primary tracking-[-0.015em] leading-snug text-[20px] max-w-[20ch]">
          {count} more tracks waiting in Eduto.
        </p>
        <Link
          href="/eduto"
          className="
            group relative inline-flex items-center gap-2 pl-5 pr-1.5 py-1.5
            rounded-full text-[13.5px] font-medium text-white overflow-hidden
            transition-transform duration-300 active:scale-[0.98]
          "
          style={{
            background: 'var(--blue)',
            boxShadow: '0 10px 24px -12px color-mix(in oklab, var(--blue) 70%, transparent)',
          }}
        >
          <span className="relative">Browse more courses</span>
          <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15 backdrop-blur-md transition-transform duration-300 group-hover:translate-x-0.5">
            <ArrowSvg />
          </span>
        </Link>
        <button
          type="button"
          onClick={onReshuffle}
          className="mt-1 text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors link-trail"
        >
          Reshuffle the deck
        </button>
      </div>
    </div>
  )
}

export function MobileCourseList({ courses }: Props) {
  const [topIndex, setTopIndex] = useState(0)
  if (courses.length === 0) return null

  // Only the top three cards are rendered for performance.
  // DOM order is bottom-to-top so the apex paints last.
  const VISIBLE = 3
  const visible = courses.slice(topIndex, topIndex + VISIBLE)
  const allDismissed = visible.length === 0

  return (
    <section
      data-screen-label="03 Courses (mobile)"
      className="md:hidden relative px-5 py-10"
    >
      {/* Soft Codemo-blue wash localised to this section.
          Sits behind the cards so the section feels grounded
          without bleeding into neighbouring blocks. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 55%, color-mix(in oklab, var(--blue) 9%, transparent) 0%, transparent 75%)',
        }}
      />

      <header className="relative z-10 mb-6">
        <span
          className="text-text-tertiary uppercase tracking-[0.24em] font-medium block"
          style={{ fontSize: 11 }}
        >
          Eduto by Codemo
        </span>
        <h2 className="mt-2 font-sans font-semibold tracking-[-0.025em] text-text-primary leading-snug text-[clamp(22px,6.5vw,30px)]">
          A library you{' '}
          <span className="text-text-secondary">swipe through.</span>
        </h2>
        <p className="mt-2 text-text-secondary text-[13px] leading-[1.5] max-w-[36ch] font-light">
          Swipe a card any direction — left, right, up, down — to flip to the next.
        </p>
      </header>

      {/* Card stage. Fixed-aspect box so the section reserves
          its own height and the page below never reflows when
          a card flies off. Cards inside use absolute inset-0
          so they stack on top of each other. */}
      <div
        className="relative z-10 mx-auto"
        style={{
          width: 'min(88%, 340px)',
          height: 'min(112vw, 460px)',
          maxHeight: '60vh',
        }}
      >
        {allDismissed ? (
          <BrowseMoreCard
            count={courses.length}
            onReshuffle={() => setTopIndex(0)}
          />
        ) : (
          /* Render bottom-first (deepest in DOM) so the apex
             card paints on top without needing manual zIndex
             juggling. */
          visible
            .slice()
            .reverse()
            .map((c, idx) => {
              const depth = visible.length - 1 - idx
              return (
                <SwipeCard
                  key={c.id}
                  c={c}
                  depth={depth}
                  zIndex={100 - depth}
                  onDismiss={() => setTopIndex((i) => i + 1)}
                />
              )
            })
        )}
      </div>

      {/* Progress pip row — shows position in the deck.
          Tinted past, blue accent for current, muted ahead. */}
      <div className="relative z-10 mt-6 flex justify-center gap-1.5">
        {courses.map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              i < topIndex
                ? 'w-2 bg-text-tertiary/30'
                : i === topIndex
                  ? 'w-6'
                  : 'w-2 bg-text-tertiary/40',
            )}
            style={i === topIndex ? { background: 'var(--blue)' } : undefined}
          />
        ))}
      </div>
    </section>
  )
}
