'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

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

/* ────────────────────────────────────────────────────────────
   Feedback — refined, Apple-grade two-row marquee.

   Design choices:
     • No 3D tilt (felt gimmicky). Cards lift gently on hover
       with a soft shadow only.
     • Hairline border, low-opacity surface, comfortable padding.
     • Avatar is a perfect circle with a thin ring matching the
       design system.
     • Marquee pauses on hover so readers can dwell.
   ────────────────────────────────────────────────────────── */

function initialsFor(name: string): string {
  return name.split(' ').map((s) => s[0] ?? '').slice(0, 2).join('').toUpperCase()
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  return (
    <motion.figure
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="
        relative shrink-0
        w-[clamp(280px,30vw,360px)]
        rounded-[22px]
        bg-bg-surface ring-1 ring-border-subtle
        p-7 flex flex-col gap-5 select-text
        transition-shadow duration-300
        hover:shadow-[0_22px_48px_-26px_rgba(0,0,0,0.35)]
      "
    >
      <blockquote
        className="text-text-primary font-light leading-[1.55] tracking-[-0.005em]"
        style={{ fontSize: 'clamp(15px, 1.15vw, 17px)' }}
      >
        <span aria-hidden="true" className="text-text-tertiary mr-0.5">“</span>
        {item.content}
        <span aria-hidden="true" className="text-text-tertiary ml-0.5">”</span>
      </blockquote>

      <figcaption className="mt-auto flex items-center gap-3">
        <span
          className="
            inline-flex items-center justify-center
            w-10 h-10 rounded-full shrink-0
            text-[11px] font-semibold text-text-primary
            ring-1 ring-border-subtle overflow-hidden
          "
          style={{ background: 'color-mix(in oklab, var(--text1) 5%, transparent)' }}
        >
          {item.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            initialsFor(item.name)
          )}
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-text-primary truncate">{item.name}</div>
          {item.role && (
            <div className="text-[12px] text-text-tertiary mt-0.5 truncate">{item.role}</div>
          )}
        </div>
      </figcaption>
    </motion.figure>
  )
}

function MarqueeRow({
  items,
  duration = 64,
  reverse = false,
}: {
  items: FeedbackItem[]
  duration?: number
  reverse?: boolean
}) {
  const doubled = useMemo(() => [...items, ...items], [items])
  return (
    <div className="marquee-fade overflow-hidden">
      <motion.div
        className="flex gap-4 w-max py-2 group/row"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
        whileHover={{ transition: { duration: 0 } }}
      >
        {doubled.map((item, i) => (
          <FeedbackCard key={`${item.id}-${i}`} item={item} />
        ))}
      </motion.div>
    </div>
  )
}

export function Feedback({ items }: Props) {
  if (items.length === 0) return null
  const mid = Math.ceil(items.length / 2)
  const rowA = items.slice(0, mid)
  const rowB = items.slice(mid).length > 0 ? items.slice(mid) : items.slice(0, mid)
  return (
    <div className="space-y-4">
      <MarqueeRow items={rowA} duration={64} />
      <MarqueeRow items={rowB} duration={86} reverse />
    </div>
  )
}
