'use client'

import { Briefcase, Mail, MessageSquare } from 'lucide-react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Transition,
  type Variants,
} from 'framer-motion'
import { useRef, type ComponentType, type ReactNode } from 'react'
import { SoftReveal } from './SoftReveal'

type LucideIconType = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>

/* ────────────────────────────────────────────────────────────
   ContactSection — "Talk to a human at Codemo."

   Layout:
     • Two-column composition on lg+:
       LEFT  — editorial title + sub + channel rail
       RIGHT — visual portrait (image area with a graceful
               placeholder; swap in a real asset when supplied).
     • Channel rail is a vertical list of magnetic links with
       hairline dividers — readable, scannable, no card chrome.
     • Section sits on a softly-glassed surface (border + low-
       opacity background) so it blends with the page palette.
   ────────────────────────────────────────────────────────── */

/* Each channel declares its own per-hover icon gesture so the
   three rows feel alive without being noisy. */
interface Channel {
  icon: LucideIconType
  target: string
  href: string
  hint: string
  accent: string
  /** Gesture variants applied to the icon glyph when the row is hovered. */
  gesture: Variants
}

const tilt: Variants = { rest: { rotate: 0 }, hover: { rotate: [0, -10, 6, -3, 0] } }
const wiggle: Variants = { rest: { x: 0 }, hover: { x: [0, -2, 2, -1.5, 0] } }
const lift: Variants = { rest: { y: 0 }, hover: { y: [0, -3, 0] } }

const CHANNELS: ReadonlyArray<Channel> = [
  {
    icon: Mail,
    target: 'team@codemoteam.org',
    href: 'mailto:team@codemoteam.org',
    hint: 'Answered within 24 hours.',
    accent: 'var(--blue)',
    gesture: tilt,
  },
  {
    icon: MessageSquare,
    target: 'discord.gg/codemo',
    href: 'https://discord.gg/codemo',
    hint: 'Where the community lives.',
    accent: 'var(--accent-coral)',
    gesture: wiggle,
  },
  {
    icon: Briefcase,
    target: 'partnerships@codemoteam.org',
    href: 'mailto:partnerships@codemoteam.org',
    hint: 'Hiring, sponsorship, curriculum.',
    accent: 'var(--accent-saffron)',
    gesture: lift,
  },
]

const magneticSpring: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 22,
  mass: 0.9,
}

function ArrowSvg() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

/* ─── Magnetic link — cursor-pull on hover ─────────────── */
function MagneticLink({
  children,
  href,
  external,
  className,
}: {
  children: ReactNode
  href: string
  external?: boolean
  className?: string
}) {
  const ref = useRef<HTMLAnchorElement | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, magneticSpring)
  const sy = useSpring(my, magneticSpring)
  const innerX = useTransform(sx, (v) => v * 0.4)
  const innerY = useTransform(sy, (v) => v * 0.4)

  const RADIUS = 160
  const STRENGTH = 0.22

  function handleMove(e: React.PointerEvent<HTMLAnchorElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > RADIUS) {
      mx.set(0); my.set(0); return
    }
    const falloff = 1 - dist / RADIUS
    mx.set(dx * STRENGTH * falloff)
    my.set(dy * STRENGTH * falloff)
  }
  function handleLeave() { mx.set(0); my.set(0) }

  return (
    <motion.a
      ref={ref}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{ x: sx, y: sy }}
      className={className}
      data-cursor-active
    >
      <motion.span style={{ x: innerX, y: innerY }} className="block">
        {children}
      </motion.span>
    </motion.a>
  )
}

/* ─── Visual portrait — clean abstract Codemo-blue surface.
   Pure atmosphere. Swap in a real <Image src=… fill className="object-cover" />
   when the asset is provided — this container already has the
   right rounded shape and min-heights. */
function ContactPortrait() {
  return (
    <div className="relative w-full h-full min-h-[320px] lg:min-h-[460px] rounded-[28px] overflow-hidden border border-border-subtle">
      {/* Base mesh — deep Codemo blue, no text, no captions */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 90% at 18% 18%, color-mix(in oklab, var(--blue) 58%, transparent) 0%, transparent 55%), radial-gradient(110% 90% at 82% 82%, color-mix(in oklab, var(--blue) 32%, transparent) 0%, transparent 60%), linear-gradient(155deg, #0a1230 0%, #05060c 100%)',
        }}
      />
      {/* Slow-drifting halos for life — purely decorative */}
      <motion.div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-[280px] h-[280px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--blue) 55%, transparent), transparent 70%)' }}
        animate={{ x: [0, 14, 0], y: [0, 10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-16 -left-12 w-[260px] h-[260px] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--blue) 35%, transparent), transparent 70%)' }}
        animate={{ x: [0, -12, 0], y: [0, -8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Hairline grid for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Soft vignette so the edges feel finished */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.28) 100%)' }}
      />
    </div>
  )
}

export function ContactSection() {
  return (
    <section
      id="contact"
      data-screen-label="08 Contact"
      className="relative px-4 md:px-8 py-10 md:py-24"
    >
      <div className="relative max-w-[1180px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-stretch">
          {/* ── LEFT — editorial column ─────────────────── */}
          <div className="lg:col-span-7 flex flex-col">
            <SoftReveal as="header">
              <span className="text-text-tertiary uppercase tracking-wide font-medium text-xs">
                Reach out
              </span>
              <h2 className="mt-3 font-sans font-semibold tracking-normal text-text-primary leading-snug text-2xl md:text-4xl lg:text-5xl">
                Talk to a human{' '}
                <span className="text-text-secondary">at Codemo.</span>
              </h2>
              <p className="mt-4 max-w-xl text-text-secondary font-normal text-sm md:text-lg leading-[1.5]">
                Three ways in. Pick whichever fits the conversation —
                no forms, no funnels, no sales team.
              </p>
            </SoftReveal>

            {/* Channel rail.
                Layout:  [ icon squircle ] [ target email + hint ]
                Removed the small "EMAIL / DISCORD / ENTERPRISE"
                micro-labels — the target string itself already
                identifies the channel.
                Each row's icon plays its own gesture on hover
                (tilt for Mail, wiggle for Discord, lift for
                Briefcase) so the rail feels live without being
                noisy. */}
            <ul className="mt-10 md:mt-12 divide-y divide-border-subtle/70">
              {CHANNELS.map(({ icon: Icon, target, href, hint, accent, gesture }) => {
                const external = href.startsWith('http')
                return (
                  <li key={target}>
                    <MagneticLink
                      href={href}
                      external={external}
                      className="
                        group relative flex items-center gap-5
                        py-5 outline-none
                        focus-visible:ring-2 focus-visible:ring-[color:var(--blue)] focus-visible:rounded-md
                      "
                    >
                      <motion.span
                        initial="rest"
                        animate="rest"
                        whileHover="hover"
                        className="
                          inline-flex items-center justify-center
                          w-12 h-12 rounded-[14px] shrink-0
                          text-white
                          ring-1 ring-inset
                        "
                        style={{
                          background: `linear-gradient(160deg, color-mix(in oklab, ${accent} 92%, white 18%), ${accent})`,
                          boxShadow: `0 8px 18px -8px color-mix(in oklab, ${accent} 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.18)`,
                          ['--tw-ring-color' as 'color']: `color-mix(in oklab, ${accent} 35%, transparent)`,
                        } as React.CSSProperties}
                      >
                        {/* Outer container keeps the squircle still;
                            inner motion.span runs the gesture. */}
                        <motion.span
                          variants={gesture}
                          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                          className="inline-flex"
                        >
                          <Icon size={22} strokeWidth={1.9} aria-hidden />
                        </motion.span>
                      </motion.span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-medium text-text-primary text-lg md:text-2xl tracking-tight">
                          <span className="truncate">{target}</span>
                          <span
                            aria-hidden="true"
                            className="inline-flex shrink-0 text-text-tertiary transition-transform group-hover:translate-x-0.5"
                          >
                            <ArrowSvg />
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-text-tertiary">{hint}</div>
                      </div>
                    </MagneticLink>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* ── RIGHT — image / portrait area ──────────── */}
          <div className="lg:col-span-5 flex">
            <ContactPortrait />
          </div>
        </div>
      </div>
    </section>
  )
}
