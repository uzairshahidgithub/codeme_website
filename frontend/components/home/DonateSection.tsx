'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, CheckCircle2, GraduationCap, HeartHandshake, Loader2, Server, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { simulateOCR } from '@/lib/ocr'

const MIN = 100
const MAX = 5000
const STEP = 100

const HIGHLIGHTS = [
  { icon: GraduationCap, title: 'Scholarships for students', body: 'Course access for learners who can’t self-fund.' },
  { icon: Server, title: 'Server & infrastructure', body: 'Discord, hosting, OCR, and OSS tooling we run for free.' },
  { icon: Calendar, title: 'Community events', body: 'Workshops, mentor calls and live builds — open to all.' },
] as const

const ACCOUNTS = [
  { label: 'JazzCash', value: '0300 1234567', name: 'Codemo Teams' },
  { label: 'Easypaisa', value: '0345 7654321', name: 'Codemo Teams' },
  { label: 'Bank transfer (Meezan)', value: 'PK36 MEZN 0001 2345 6789 1011', name: 'Codemo Teams' },
] as const

type ModalState = 'idle' | 'processing' | 'success'

function formatPkr(n: number): string {
  return `Rs. ${n.toLocaleString('en-PK')}`
}

export function DonateSection() {
  const [amount, setAmount] = useState(500)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ModalState>('idle')
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
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
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setState('idle')
    setDragging(false)
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const handleFile = useCallback(
    async (file: File) => {
      setState('processing')
      try {
        const ocr = await simulateOCR(file)
        // Image is intentionally discarded — we only send the OCR text.
        await fetch('/api/donations/intent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            amount,
            currency: 'PKR',
            ocr_text: ocr.text,
            transaction_id: ocr.transactionId,
          }),
        }).catch(() => null)
        setState('success')
        closeTimerRef.current = window.setTimeout(closeModal, 3000)
      } catch {
        setState('idle')
      }
    },
    [amount],
  )

  function onPickClick() {
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  return (
    <section
      data-screen-label="07 Donate"
      className="bg-white dark:bg-[#0A0A0A] transition-colors duration-300 ease-in-out"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* LEFT — highlights */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500 text-xs font-semibold uppercase tracking-widest px-3 py-1 mb-5">
              <HeartHandshake size={14} strokeWidth={1.8} />
              Support
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white !leading-tight">
              Empower the next generation of developers.
            </h2>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-400 max-w-prose">
              Every contribution funds open scholarships, the servers we run for free, and the
              workshops and mentor calls behind the doors of our community.
            </p>

            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex items-start gap-4 rounded-2xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-white/10 p-4"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Icon size={20} strokeWidth={1.6} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — interactive slider */}
          <div className="rounded-3xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-white/10 p-8 md:p-10 shadow-2xl shadow-gray-200/40 dark:shadow-black/40">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              I want to contribute
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white tabular-nums">
                {formatPkr(amount)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ one-time</span>
            </div>

            <input
              type="range"
              min={MIN}
              max={MAX}
              step={STEP}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              aria-label="Donation amount in PKR"
              className="mt-8 w-full h-2 rounded-full bg-gray-200 dark:bg-white/10 appearance-none cursor-pointer accent-blue-600"
            />

            <div className="mt-2 flex justify-between text-[11px] font-medium uppercase tracking-widest text-gray-500 dark:text-gray-500">
              <span>Rs. {MIN}</span>
              <span>Rs. {MAX.toLocaleString('en-PK')}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[200, 500, 1000, 2500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={[
                    'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                    amount === preset
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-blue-500/40',
                  ].join(' ')}
                >
                  {formatPkr(preset)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={openModal}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700 dark:hover:bg-blue-500 active:translate-y-0.5"
            >
              <HeartHandshake size={18} strokeWidth={1.8} />
              Support with {formatPkr(amount)}
            </button>

            <p className="mt-3 text-xs text-gray-500 dark:text-gray-500 text-center">
              Manual transfer via JazzCash / Easypaisa / Bank — no card details stored.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Donation flow"
          >
            <button
              type="button"
              aria-label="Close donation dialog"
              onClick={closeModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative w-full max-w-lg rounded-3xl bg-[#141414]/95 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/60 p-7 md:p-8 text-white"
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={18} strokeWidth={1.6} />
              </button>

              {state === 'idle' && (
                <>
                  <div className="text-xs font-semibold uppercase tracking-widest text-blue-400">
                    Step 1 of 2 · Transfer
                  </div>
                  <h3 className="mt-2 text-2xl font-bold tracking-tight">
                    Send {formatPkr(amount)} to any account
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Pick the wallet you use, transfer the amount, then upload a screenshot of the
                    success page. We extract the reference text and discard the image.
                  </p>

                  <ul className="mt-5 space-y-3">
                    {ACCOUNTS.map((a) => (
                      <li
                        key={a.label}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs uppercase tracking-widest text-gray-400">{a.label}</div>
                          <div className="font-mono text-sm font-semibold text-white truncate">{a.value}</div>
                          <div className="text-xs text-gray-500">{a.name}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(a.value).catch(() => null)}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                        >
                          Copy
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 text-xs font-semibold uppercase tracking-widest text-blue-400">
                    Step 2 of 2 · Upload screenshot
                  </div>
                  <div
                    onDragEnter={(e) => {
                      e.preventDefault()
                      setDragging(true)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={onPickClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onPickClick()
                      }
                    }}
                    className={[
                      'mt-2 flex flex-col items-center justify-center text-center gap-2',
                      'rounded-2xl border-2 border-dashed cursor-pointer',
                      'px-6 py-8 transition-colors',
                      dragging
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/15 hover:border-blue-500/60 hover:bg-white/5',
                    ].join(' ')}
                  >
                    <Upload size={22} strokeWidth={1.6} className="text-blue-400" />
                    <div className="text-sm font-semibold">Drop your screenshot here</div>
                    <div className="text-xs text-gray-400">PNG or JPG — image is read once and discarded</div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={onFileChange}
                    className="sr-only"
                  />
                </>
              )}

              {state === 'processing' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 size={36} strokeWidth={1.6} className="animate-spin text-blue-400" />
                  <div className="mt-5 text-base font-semibold">Reading your receipt</div>
                  <div className="mt-1 text-sm text-gray-400">Extracting transaction reference…</div>
                </div>
              )}

              {state === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 mb-4"
                  >
                    <CheckCircle2 size={36} strokeWidth={1.8} />
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    className="text-3xl"
                    aria-hidden="true"
                  >
                    💙
                  </motion.div>
                  <div className="mt-3 text-lg font-bold">Thank you! Your support fuels our mission.</div>
                  <div className="mt-1 text-xs text-gray-400">Admin will verify and confirm shortly.</div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
