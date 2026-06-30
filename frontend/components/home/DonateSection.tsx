'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  HeartHandshake,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { SoftReveal } from './SoftReveal'

const MIN = 100
const MAX = 5000
const STEP = 100

const ACCOUNTS_DEFAULT = [
  { label: 'JazzCash',                value: '0300 1234567',                 name: 'Codemo Teams' },
  { label: 'Easypaisa',               value: '0345 7654321',                 name: 'Codemo Teams' },
  { label: 'Meezan Bank transfer',    value: 'PK36 MEZN 0001 2345 6789 1011', name: 'Codemo Teams' },
] as const

export type DonateAccount = { label: string; value: string; name: string }

interface DonateSectionProps {
  accounts?: DonateAccount[]
}

const IMPACT_TIERS = [
  { upTo:  400, label: 'A learner gets a month of mentor office hours.' },
  { upTo: 1000, label: 'One Pakistan-based bootcamp seat funded for a sprint.' },
  { upTo: 2500, label: 'A regional meetup runs — venue, food, recording kit.' },
  { upTo: Infinity, label: 'A full-quarter scholarship for a high-potential student.' },
] as const

type ModalState = 'idle' | 'details' | 'processing' | 'success'

const PAYMENT_METHODS = [
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'Easypaisa' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
] as const

const donateInputClass =
  'w-full rounded-[14px] px-4 py-3 text-sm text-text-primary bg-transparent border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--blue)]'

function formatPkr(n: number): string {
  return `Rs. ${n.toLocaleString('en-PK')}`
}

function impactFor(amount: number): string {
  return IMPACT_TIERS.find((t) => amount <= t.upTo)?.label ?? IMPACT_TIERS[IMPACT_TIERS.length - 1].label
}

/* ─── WaveSlider — modern audio-EQ style ───────────────────
   The track is a row of vertical bars whose heights follow a
   sine wave (the "zigzag" the brief asked for). Bars to the
   LEFT of the thumb are lit in Codemo-blue with a soft glow;
   bars to the RIGHT sit at low opacity. A vertical guideline
   drops from the thumb down through the bars so the user can
   read the current value at a glance.

   Why this is more interesting than a flat track:
     • The wave creates rhythm — it's literally an equalizer
       skin, which fits the "support the signal" theme.
     • Active/inactive states are read per-bar, so dragging
       feels like physically filling a sound level.
     • The bars are pointer-events:none so the entire pixel
       row above them stays draggable from any spot.

   Same accessibility surface as the previous slider: role,
   aria-* attrs, keyboard arrows, focus ring. */

const BAR_COUNT = 34

function WaveSlider({
  value,
  onChange,
  min = MIN,
  max = MAX,
  step = STEP,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const fill = ((value - min) / (max - min)) * 100

  function commit(clientX: number) {
    const el = trackRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width <= 0) return
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    const raw = min + pct * (max - min)
    const stepped = Math.round(raw / step) * step
    const next = Math.max(min, Math.min(max, stepped))
    if (next !== value) onChange(next)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    commit(e.clientX)
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    commit(e.clientX)
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return
    setDragging(false)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
  }

  return (
    <div className="relative select-none">
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label="Donation amount in PKR"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft')  onChange(Math.max(min, value - step))
          if (e.key === 'ArrowRight') onChange(Math.min(max, value + step))
          if (e.key === 'Home')       onChange(min)
          if (e.key === 'End')        onChange(max)
        }}
        className="
          relative h-14 w-full cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface
          rounded-[12px]
        "
        style={{ touchAction: 'none' }}
      >
        {/* Bars — heights follow a sine wave so the row reads
            as a zigzag silhouette. Active bars (left of fill)
            paint blue with a soft glow. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-1 bottom-3 top-1 flex items-end justify-between pointer-events-none"
        >
          {Array.from({ length: BAR_COUNT }).map((_, i) => {
            const barPct = (i / (BAR_COUNT - 1)) * 100
            const isActive = barPct <= fill
            // Two summed sines give a more organic, less
            // repetitive zigzag than a single frequency.
            const wave =
              0.5 + 0.35 * Math.sin(i * 0.55 + 0.3) +
              0.15 * Math.sin(i * 0.18 + 1.7)
            const height = 6 + wave * 30 // 6 → 36px
            return (
              <span
                key={i}
                className="rounded-full transition-[background-color,opacity,box-shadow] duration-200 ease-out"
                style={{
                  width: 2.5,
                  height,
                  background: isActive
                    ? 'var(--blue)'
                    : 'color-mix(in oklab, var(--text1) 14%, transparent)',
                  opacity: isActive ? 1 : 0.55,
                  boxShadow: isActive
                    ? '0 0 6px color-mix(in oklab, var(--blue) 55%, transparent)'
                    : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Guideline — vertical line dropping from the thumb
            through the bars. Helps the eye snap the thumb to
            the current value. */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-3 transition-[left] duration-150 ease-out pointer-events-none"
          style={{
            left: `${fill}%`,
            transform: 'translateX(-50%)',
            width: 1,
            background: 'color-mix(in oklab, var(--blue) 45%, transparent)',
          }}
        />

        {/* Thumb — glowing ball that rides on top of the bars.
            Scales up on drag and gets a 10px halo. */}
        <div
          aria-hidden="true"
          className="absolute top-0 transition-[left,transform,box-shadow] duration-150 ease-out"
          style={{
            left: `${fill}%`,
            transform: `translate(-50%, 0) scale(${dragging ? 1.15 : 1})`,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: 'var(--blue)',
            boxShadow: dragging
              ? '0 6px 16px -2px color-mix(in oklab, var(--blue) 65%, transparent), 0 0 0 8px color-mix(in oklab, var(--blue) 20%, transparent)'
              : '0 4px 10px -2px color-mix(in oklab, var(--blue) 55%, transparent)',
          }}
        />
      </div>

      <div className="mt-3 flex justify-between text-[11px] text-text-tertiary tabular-nums">
        <span>{formatPkr(min)}</span>
        <span>{formatPkr(max)}</span>
      </div>
    </div>
  )
}

/* ─── Donate CTA — breathing pulse that pauses on hover ── */

function DonateCta({ amount, onClick }: { amount: number; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 0.97 }}
      animate={hovered ? { scale: 1.05 } : { scale: [1, 1.02, 1] }}
      transition={
        hovered
          ? { type: 'spring', stiffness: 280, damping: 22 }
          : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
      }
      className="
        mt-7 inline-flex w-full items-center justify-center gap-2
        rounded-full px-6 py-3.5 text-base font-medium text-white
        shadow-[0_10px_28px_-14px_color-mix(in_oklab,var(--blue)_70%,transparent)]
      "
      style={{ background: 'var(--blue)' }}
      data-cursor-active
      aria-label={`Donate Rs. ${amount}`}
    >
      <HeartHandshake size={18} strokeWidth={1.6} />
      Support with Rs. {amount.toLocaleString('en-PK')}
    </motion.button>
  )
}

/* ─── Confetti burst — lightweight CSS-only particles ──── */

function ConfettiBurst() {
  const PARTICLES = 14
  const colors = ['var(--blue)', 'var(--accent-saffron)', 'var(--accent-coral)', 'var(--accent-lime)']
  return (
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: PARTICLES }).map((_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        const distance = 70 + Math.random() * 30
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance
        const color = colors[i % colors.length]
        const size = 6 + Math.round(Math.random() * 4)
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: i * 0.012 }}
            className="absolute left-1/2 top-[40%] rounded-full"
            style={{ width: size, height: size, background: color, translateX: '-50%', translateY: '-50%' }}
          />
        )
      })}
    </div>
  )
}

/* ─── Static value display ─────────────────────────────────
   The previous PulseCounter re-keyed an AnimatePresence on
   every slider step, spawning 50+ motion mounts per second
   during drag and crashing the page. The pulse is no longer
   needed — the slider's own thumb/track already gives tactile
   feedback. Plain tabular-nums text is fast and stable. ─── */

function PulseCounter({ value }: { value: number }) {
  return <span className="inline-block tabular-nums">{formatPkr(value)}</span>
}

export function DonateSection({ accounts: accountsProp }: DonateSectionProps = {}) {
  const accounts: DonateAccount[] = accountsProp?.length
    ? accountsProp
    : ACCOUNTS_DEFAULT.map((a) => ({ label: a.label, value: a.value, name: a.name }))
  const [amount, setAmount] = useState(500)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ModalState>('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [formAmount, setFormAmount] = useState(String(amount))
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  function openModal() {
    setState('idle')
    setSubmitError(null)
    setReceiptFile(null)
    setFormAmount(String(amount))
    setOpen(true)
  }
  function closeModal() {
    setOpen(false); setState('idle'); setSubmitError(null); setDragging(false); setReceiptFile(null)
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current); closeTimerRef.current = null
    }
  }

  useEffect(() => {
    if (open) setFormAmount(String(amount))
  }, [amount, open])

  function pickReceipt(file: File) {
    setReceiptFile(file)
    setSubmitError(null)
    setState('details')
  }

  async function handleSubmitDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!receiptFile) {
      setSubmitError('Please upload your payment receipt.')
      setState('idle')
      return
    }

    setState('processing')
    setSubmitError(null)

    const fd = new FormData(e.currentTarget)
    fd.append('receipt', receiptFile, receiptFile.name)
    fd.set('currency', 'PKR')

    try {
      const res = await fetch('/api/donations/submit', { method: 'POST', body: fd })
      const payload = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        throw new Error(payload?.error ?? 'Could not submit donation')
      }

      setState('success')
      closeTimerRef.current = window.setTimeout(closeModal, 3000)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submit failed')
      setState('details')
    }
  }

  function onPickClick() { fileInputRef.current?.click() }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) pickReceipt(file)
    e.target.value = ''
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) pickReceipt(file)
  }

  const impact = useMemo(() => impactFor(amount), [amount])

  return (
    <section id="donate" data-screen-label="08 Donate" className="relative px-4 md:px-8 py-10 md:py-24">
      {/* Section eyebrow centred — Apple intro pattern. */}
      <SoftReveal className="relative max-w-[920px] mx-auto text-center mb-10 md:mb-20">
        <span className="text-text-tertiary uppercase tracking-wide font-medium text-xs">
          Pakistan tech revolution
        </span>
        <h2 className="mt-4 font-sans font-semibold tracking-normal text-text-primary leading-snug text-2xl md:text-4xl">
          A builder&apos;s first opportunity{' '}
          <span className="text-text-secondary">starts with you.</span>
        </h2>
        <p className="mt-5 mx-auto max-w-[58ch] text-text-secondary font-normal text-sm md:text-lg leading-[1.5]">
          Every contribution flows directly into Pakistan&apos;s next generation of engineers — scholarships,
          regional meetups, and the servers we run so nobody is locked out.
        </p>
      </SoftReveal>

      <div className="relative max-w-[1080px] mx-auto">
        {/* `items-stretch` (grid default) + `h-full` on both
            column wrappers force the two columns to grow to
            the SAME height — the donation card auto-stretches
            to match the left "Where it goes" list and vice
            versa. On mobile the grid collapses to one column
            so this has no effect. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-stretch">
          {/* LEFT — distribution stats. flex-col so we can push
              a small footer to the bottom and balance the
              column visually against the right card. */}
          <div className="lg:col-span-5 order-2 lg:order-1 h-full flex flex-col">
            <div className="text-[11px] uppercase tracking-[0.22em] text-text-tertiary font-medium mb-5">
              Where it goes
            </div>
            <ul className="divide-y divide-border-subtle/60">
              {[
                ['83%', 'Learner scholarships.', 'Tuition-free seats for self-funded students.'],
                ['12%', 'Regional meetups.',     'Karachi · Lahore · Islamabad and beyond.'],
                ['5%',  'Infrastructure.',      'Discord, OCR pipeline, and hosting we run for free.'],
              ].map(([pct, head, body]) => (
                <li key={pct} className="flex items-start gap-6 py-5">
                  <span
                    className="font-sans font-medium tabular-nums tracking-[-0.04em] text-text-primary w-16 shrink-0"
                    style={{ fontSize: 'clamp(22px, 2.6vw, 32px)' }}
                  >
                    {pct}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[14px] md:text-[15px] font-medium text-text-primary">{head}</div>
                    <div className="text-[13px] md:text-[14px] text-text-tertiary mt-1 font-light leading-[1.5]">{body}</div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Soft trust line at the bottom — pushed down so
                the left column always meets the right card's
                bottom edge even when the card is taller. */}
            <p className="mt-auto pt-6 text-[12px] leading-[1.55] text-text-tertiary border-t border-border-subtle/50">
              Every Rs. you send is publicly logged in our quarterly transparency report.
            </p>
          </div>

          {/* RIGHT — donation card. Wrapper is `flex` so the
              motion.div can grow to fill the grid row height. */}
          <div className="lg:col-span-7 order-1 lg:order-2 h-full flex">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="
                relative w-full flex flex-col
                rounded-3xl p-6 md:p-12
                bg-bg-surface
                border border-border-subtle
                overflow-hidden
                transition-shadow duration-300
                hover:shadow-[0_30px_60px_-26px_color-mix(in_oklab,var(--blue)_40%,transparent)]
              "
            >
              {/* Soft accent halo (kept inside the card) */}
              <div
                aria-hidden="true"
                className="absolute -top-24 -right-20 w-[360px] h-[260px] rounded-full blur-3xl opacity-60 pointer-events-none"
                style={{ background: 'radial-gradient(closest-side, color-mix(in oklab, var(--blue) 25%, transparent), transparent 70%)' }}
              />

              <div className="relative flex flex-col flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-text-tertiary font-medium">
                    I want to contribute
                  </div>
                  <div className="text-[11px] text-text-tertiary">One-time · PKR</div>
                </div>

                <div className="mt-3 md:mt-4 flex items-baseline gap-2">
                  <span
                    className="font-sans font-medium text-text-primary leading-none tracking-[-0.045em] text-[clamp(36px,8vw,68px)]"
                  >
                    <PulseCounter value={amount} />
                  </span>
                </div>

                <div className="mt-4 md:mt-6">
                  <WaveSlider value={amount} onChange={setAmount} />
                </div>

                {/* Preset amount chips — scale pulse on hover,
                    press animation on click, soft blue highlight
                    when selected. */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {[200, 500, 1000, 2500].map((preset) => {
                    const active = amount === preset
                    return (
                      <motion.button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        animate={
                          active
                            ? { backgroundColor: 'rgba(59, 130, 246, 0.15)' }
                            : { backgroundColor: 'rgba(59, 130, 246, 0)' }
                        }
                        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                        className="text-xs font-medium px-3 py-1.5 rounded-full"
                        style={{
                          color: active ? 'var(--blue)' : 'var(--text2)',
                          border: `1px solid ${active ? 'color-mix(in oklab, var(--blue) 45%, transparent)' : 'var(--border)'}`,
                        }}
                      >
                        {formatPkr(preset)}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Spring impact callout */}
                <motion.div
                  layout
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                  className="
                    mt-6 rounded-[14px] px-4 py-3
                    bg-[color:color-mix(in_oklab,var(--blue)_8%,transparent)]
                    ring-1 ring-[color:color-mix(in_oklab,var(--blue)_25%,transparent)]
                    text-[13px] leading-[1.55] text-text-secondary
                  "
                >
                  <span className="font-medium text-text-primary">Impact: </span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={impact}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {impact}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>

                {/* `mt-auto` pins the CTA + footer note to the
                    bottom of the card so when the card stretches
                    to match the left column height, the empty
                    space lands above the CTA instead of between
                    the impact line and the action. */}
                <div className="mt-auto">
                  <DonateCta amount={amount} onClick={openModal} />
                  <span className="sr-only">{`Donate ${formatPkr(amount)}`}</span>
                  <p className="mt-3 text-xs text-text-tertiary text-center">
                    Manual transfer via JazzCash / Easypaisa / Bank — no card details stored.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[400] flex items-center justify-center p-4"
            role="dialog" aria-modal="true" aria-label="Donation flow"
          >
            {/* Backdrop — darker + stronger blur so the modal
                reads as the only thing on screen. Click anywhere
                outside the dialog to dismiss. */}
            <button
              type="button" aria-label="Close donation dialog"
              onClick={closeModal}
              className="absolute inset-0 modal-backdrop backdrop-blur-[12px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              className="relative w-full max-w-lg rounded-[24px] glass-card overflow-hidden p-7 md:p-8 text-text-primary"
            >
              <button
                type="button" onClick={closeModal} aria-label="Close"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-text-primary/5 transition-colors"
              >
                <X size={18} strokeWidth={1.6} />
              </button>

              {state === 'idle' && (
                <>
                  <div className="text-[11px] uppercase tracking-[0.18em] font-medium" style={{ color: 'var(--blue)' }}>
                    Step 1 of 2 · Transfer
                  </div>
                  <h3 className="mt-2 font-sans font-medium tracking-[-0.025em] text-text-primary text-[22px] md:text-[26px] leading-tight">
                    Send {formatPkr(amount)} to any account
                  </h3>
                  <p className="mt-2 text-sm text-text-tertiary">
                    Pick the wallet you use, transfer the amount, then upload your receipt and fill in the details.
                  </p>

                  <ul className="mt-5 space-y-2">
                    {accounts.map((a) => (
                      <li key={a.label}
                        className="flex items-center justify-between gap-3 rounded-[14px] px-4 py-3"
                        style={{
                          background: 'color-mix(in oklab, var(--text1) 4%, transparent)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-text-tertiary font-medium">{a.label}</div>
                          <div className="font-mono text-sm font-medium text-text-primary truncate">{a.value}</div>
                          <div className="text-xs text-text-tertiary">{a.name}</div>
                        </div>
                        <button type="button"
                          onClick={() => navigator.clipboard?.writeText(a.value).catch(() => null)}
                          className="text-xs font-medium shrink-0 transition-colors"
                          style={{ color: 'var(--blue)' }}
                        >
                          Copy
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 text-[11px] uppercase tracking-[0.18em] font-medium" style={{ color: 'var(--blue)' }}>
                    Step 2 of 2 · Upload screenshot
                  </div>
                  <div
                    onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={onPickClick}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPickClick() } }}
                    className="mt-2 flex flex-col items-center justify-center text-center gap-2 rounded-[16px] cursor-pointer px-6 py-8 transition-colors"
                    style={{
                      border: `1.5px dashed ${dragging ? 'var(--blue)' : 'var(--border)'}`,
                      background: dragging ? 'color-mix(in oklab, var(--blue) 8%, transparent)' : 'transparent',
                    }}
                  >
                    <Upload size={22} strokeWidth={1.6} style={{ color: 'var(--blue)' }} />
                    <div className="text-sm font-medium text-text-primary">Drop your screenshot here</div>
                    <div className="text-xs text-text-tertiary">PNG or JPG — up to 5 MB</div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={onFileChange} className="sr-only" />
                  {submitError && (
                    <p className="mt-3 text-sm text-text-error text-center" role="alert">{submitError}</p>
                  )}
                </>
              )}

              {state === 'details' && (
                <form onSubmit={handleSubmitDetails} className="max-h-[70vh] overflow-y-auto pr-1">
                  <div className="text-[11px] uppercase tracking-[0.18em] font-medium" style={{ color: 'var(--blue)' }}>
                    Step 3 of 3 · Your details
                  </div>
                  <h3 className="mt-2 font-sans font-medium tracking-[-0.025em] text-text-primary text-[22px] leading-tight">
                    Confirm your donation
                  </h3>
                  <p className="mt-2 text-sm text-text-tertiary">
                    Receipt attached: <span className="text-text-secondary">{receiptFile?.name}</span>
                  </p>

                  <div className="mt-5 flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-text-secondary">Full name</span>
                      <input name="donor_name" type="text" required maxLength={120} className={donateInputClass} placeholder="Your name" />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-text-secondary">Amount sent (PKR)</span>
                      <input
                        name="amount"
                        type="number"
                        min={100}
                        max={5000}
                        step={1}
                        required
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className={donateInputClass}
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-text-secondary">Transaction ID / reference</span>
                      <input name="transaction_id" type="text" required maxLength={120} className={donateInputClass} placeholder="From your receipt" />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-text-secondary">Payment method</span>
                      <select name="payment_method" required defaultValue="jazzcash" className={donateInputClass}>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-text-secondary">Email (optional)</span>
                      <input name="donor_email" type="email" maxLength={200} className={donateInputClass} placeholder="you@example.com" />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-text-secondary">Phone (optional)</span>
                      <input name="donor_phone" type="tel" maxLength={40} className={donateInputClass} placeholder="03XX XXXXXXX" />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-text-secondary">Note (optional)</span>
                      <textarea name="donor_notes" rows={3} maxLength={2000} className={donateInputClass} placeholder="Anything we should know?" />
                    </label>
                  </div>

                  {submitError && (
                    <p className="mt-3 text-sm text-text-error text-center" role="alert">{submitError}</p>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setState('idle'); setSubmitError(null) }}
                      className="flex-1 rounded-full px-4 py-3 text-sm font-medium border border-[var(--border)] text-text-secondary"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-white"
                      style={{ background: 'var(--blue)' }}
                    >
                      Submit donation
                    </button>
                  </div>
                </form>
              )}

              {state === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 size={36} strokeWidth={1.6} className="animate-spin" style={{ color: 'var(--blue)' }} />
                  <div className="mt-5 text-base font-medium">Submitting your donation</div>
                  <div className="mt-1 text-sm text-text-tertiary">Saving receipt and details…</div>
                </div>
              )}

              {state === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex flex-col items-center justify-center py-10 text-center"
                >
                  {/* CSS-only confetti burst — particles fly out
                      from the checkmark in a radial pattern. */}
                  <ConfettiBurst />

                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="relative inline-flex h-16 w-16 items-center justify-center rounded-full mb-4"
                    style={{ color: 'var(--blue)', background: 'color-mix(in oklab, var(--blue) 14%, transparent)' }}
                  >
                    <CheckCircle2 size={36} strokeWidth={1.8} />
                  </motion.div>
                  <div className="relative mt-3 text-lg font-medium">Thank you! Your support fuels the revolution.</div>
                  <div className="relative mt-1 text-xs text-text-tertiary">Admin will verify and confirm shortly.</div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
