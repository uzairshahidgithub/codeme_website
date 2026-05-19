'use client'

import Link from 'next/link'
import { Fragment } from 'react'
import { motion, type Variants } from 'framer-motion'
import { BlueHaze } from './BlueHaze'
import { CountUp } from './CountUp'

/* ────────────────────────────────────────────────────────────
   HERO — Apple proportions, Windows-11-style word reveal,
   cursor-tracked blue haze ambient (homepage-only).

   Word-spacing fix:
   JSX `.map()` does NOT insert text-node whitespace between
   sibling spans. Previously the words were spaced only by
   `margin-right` on each `inline-block`, which gave the
   impression of squashed text. We now emit a Fragment with
   the motion.span AND a regular `' '` text node between
   every two words — so word-spacing is governed by native
   whitespace (consistent, accessible to copy/paste) AND the
   per-word blur reveal still works.
   ────────────────────────────────────────────────────────── */

const word: Variants = {
  hidden:  { opacity: 0, y: 10, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
}

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const HEADLINE_LINE_1 = ['Talent', 'has', 'no', 'limits.']
const HEADLINE_LINE_2 = ['Money', "shouldn’t", 'be', 'the', 'gate.']

/* Stat definitions for the hero row. `target` drives the
   count-up; `format`/`suffix` shape the final string so the
   visible value is identical to what it always was
   (12.4k / 340+ / 48). */
const NAKED_STATS = [
  { target: 12400, suffix: '',  format: 'compact' as const, label: 'Members worldwide' },
  { target: 340,   suffix: '+', format: 'plain'   as const, label: 'Tutorials in library' },
  { target: 48,    suffix: '',  format: 'plain'   as const, label: 'Channels live now' },
] as const

/* Render a line of words with proper inter-word whitespace
   AND per-word motion. Each word is a motion.span; a regular
   ' ' text node sits between every pair. */
function HeadlineLine({
  words,
  accent,
  className,
}: {
  words: readonly string[]
  /** Optional substring to recolour as the brand accent. */
  accent?: string
  className?: string
}) {
  return (
    <span className={className}>
      {words.map((w, i) => {
        const isAccent = accent ? w === accent : false
        return (
          <Fragment key={i}>
            <motion.span
              variants={word}
              className="inline-block will-change-[filter,transform,opacity]"
              style={isAccent ? { color: 'var(--blue)' } : undefined}
            >
              {w}
            </motion.span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        )
      })}
    </span>
  )
}

export function Hero() {
  return (
    <section
      id="hero"
      data-cursor-active
      data-screen-label="01 Hero"
      /* Rounded top corners match the Codemo nav-radius so
         the homepage meets the floating navbar/sidebar with
         the same rounded language. The clip lives HERE
         (Hero's overflow-hidden already exists for BlueHaze)
         instead of on the page wrapper — a wrapper with
         overflow-hidden would have broken sticky elements
         in sibling sections (per CSS sticky-ancestor spec). */
      className="relative min-h-[78svh] md:min-h-[min(900px,100svh)] overflow-hidden flex items-center justify-center rounded-t-[18px] lg:rounded-t-[22px]"
    >
      {/* Cursor-tracked blue Gaussian ambient — homepage-only
          (Hero only renders inside the home route). */}
      <BlueHaze />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative z-[1] w-full max-w-[1280px] px-4 sm:px-6 md:px-10 py-6 md:py-20 text-center"
      >
        {/* Eyebrow — small label above the headline. Reduced
            mobile bottom-gap to 12px so the title sits closer
            to the eyebrow on phones. */}
        <motion.div
          variants={word}
          className="mb-3 md:mb-6 text-text-tertiary uppercase tracking-wide font-medium text-[11px] md:text-xs"
        >
          Codemo Teams · 2026
        </motion.div>

        {/* Headline — phone size dialled DOWN, desktop UP.
            Phone clamp 24→32px keeps the two-line quote from
            dominating the viewport; desktop ladders up to
            text-8xl (96px) so the editorial weight returns
            on big screens. leading-snug on phone keeps the
            two lines visually anchored. */}
        <h1 className="font-sans font-semibold tracking-tight text-text-primary leading-[1.08] mx-auto max-w-[18ch] text-[clamp(24px,7.5vw,32px)] sm:text-5xl md:text-7xl lg:text-8xl">
          <HeadlineLine words={HEADLINE_LINE_1} className="block" />
          <HeadlineLine
            words={HEADLINE_LINE_2}
            accent="gate."
            className="block text-text-secondary mt-1.5 md:mt-4"
          />
        </h1>

        <motion.p
          variants={word}
          className="mt-5 md:mt-8 mx-auto max-w-[58ch] text-text-secondary font-normal text-sm md:text-lg leading-[1.5]"
        >
          A workshop, a Discord, a syllabus and a network — wired together so curious
          learners become shipping engineers in months, not years.
        </motion.p>

        <motion.div variants={word} className="mt-6 md:mt-10 inline-flex items-center gap-5 flex-wrap justify-center">
          <Link
            href="/team"
            data-cursor-active
            className="
              group relative inline-flex items-center gap-2 pl-5 pr-1.5 py-1.5
              rounded-full text-sm font-medium text-white overflow-hidden
              transition-transform duration-300
              shadow-[0_10px_28px_-14px_color-mix(in_oklab,var(--blue)_70%,transparent)]
            "
            style={{ background: 'var(--blue)' }}
          >
            <span className="relative">Join the community</span>
            <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/15 backdrop-blur-md transition-transform duration-300 group-hover:translate-x-0.5">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </span>
          </Link>
          <Link
            href="/eduto"
            data-cursor-active
            className="text-sm font-medium text-text-secondary hover:text-text-primary link-trail transition-colors"
          >
            Browse library
          </Link>
        </motion.div>

        {/* Naked stat row */}
        <motion.dl
          variants={word}
          className="mt-7 md:mt-16 grid grid-cols-3 gap-4 sm:gap-10 md:gap-16 mx-auto max-w-[820px] border-t border-border-subtle/60 pt-5 md:pt-10"
        >
          {NAKED_STATS.map((s, i) => (
            <div key={s.label} className="flex flex-col items-center text-center min-w-0">
              <dt className="font-sans font-semibold tabular-nums tracking-tight text-text-primary leading-none text-[clamp(28px,8vw,40px)] sm:text-4xl md:text-5xl">
                {/* Staggered count-up so the three numbers
                    arrive as a wave (180ms apart) instead of
                    counting in lock-step. Triggered on view
                    via useInView inside CountUp so the
                    animation re-plays only if reduced-motion
                    isn't set. */}
                <CountUp
                  target={s.target}
                  suffix={s.suffix}
                  format={s.format}
                  duration={1.9}
                  delay={i * 0.18}
                />
              </dt>
              <dd className="mt-2 text-text-tertiary font-medium text-[11px] sm:text-xs tracking-wide leading-tight">
                {s.label}
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  )
}
