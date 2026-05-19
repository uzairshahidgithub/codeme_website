'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface CalendarEvent {
  title: string
  description?: string
  /** ISO start time. */
  start: string
  /** ISO end time. Defaults to start + 60 min. */
  end?: string
  location?: string
}

interface Props {
  event: CalendarEvent
  /** Optional override className for the trigger. */
  className?: string
}

/* ────────────────────────────────────────────────────────────
   AddToCalendar — minimal calendar dropdown with Google, Apple
   and Outlook targets. Apple/Outlook download a generated ICS
   blob; Google opens a prefilled compose URL in a new tab.
   ────────────────────────────────────────────────────────── */

function GoogleSvg() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
      <path d="M21.35 11.1H12v2.93h5.4c-.24 1.4-1.78 4.1-5.4 4.1A6.13 6.13 0 1 1 12 5.87a5.6 5.6 0 0 1 3.95 1.54l2.2-2.12A8.85 8.85 0 0 0 12 3a9 9 0 1 0 0 18c5.18 0 8.6-3.65 8.6-8.79 0-.59-.07-1.05-.15-1.51z" />
    </svg>
  )
}
function AppleSvg() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
      <path d="M16.36 12.49c0-2.62 2.14-3.88 2.24-3.94-1.22-1.79-3.13-2.04-3.81-2.07-1.63-.16-3.18.95-4.01.95-.83 0-2.1-.93-3.46-.9-1.78.03-3.43 1.04-4.34 2.62-1.85 3.21-.47 7.95 1.33 10.56.88 1.27 1.92 2.7 3.29 2.65 1.32-.05 1.82-.85 3.41-.85s2.04.85 3.45.82c1.43-.03 2.33-1.3 3.2-2.58a11.36 11.36 0 0 0 1.46-2.98c-.04-.02-2.81-1.08-2.84-4.28zM13.7 4.2c.72-.88 1.21-2.1 1.07-3.31-1.04.04-2.3.69-3.04 1.56-.67.77-1.26 2.02-1.1 3.21 1.16.09 2.34-.59 3.07-1.46z" />
    </svg>
  )
}
function OutlookSvg() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
      <path d="M2 6v12a2 2 0 0 0 2 2h14V4H4a2 2 0 0 0-2 2zm6.4 3.3a3.8 3.8 0 1 1 0 7.4 3.8 3.8 0 0 1 0-7.4zm0 1.6a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zM21 7v10l-2 1V6l2 1z" />
    </svg>
  )
}
function CalendarSvg() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  )
}

/* ─── ICS / URL helpers ──────────────────────────────────────── */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
function toUtcStamp(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}
function defaultEnd(start: string): string {
  return new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString()
}
function googleUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${toUtcStamp(e.start)}/${toUtcStamp(e.end ?? defaultEnd(e.start))}`,
    details: e.description ?? '',
    location: e.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
function outlookUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: e.start,
    enddt: e.end ?? defaultEnd(e.start),
    subject: e.title,
    body: e.description ?? '',
    location: e.location ?? '',
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}
function makeIcs(e: CalendarEvent): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Codemo Teams//Home//EN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID?.() ?? `codemo-${Date.now()}`}`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(e.start)}`,
    `DTEND:${toUtcStamp(e.end ?? defaultEnd(e.start))}`,
    `SUMMARY:${e.title.replace(/[\r\n,;]/g, ' ')}`,
    e.description ? `DESCRIPTION:${e.description.replace(/[\r\n]/g, ' ')}` : '',
    e.location ? `LOCATION:${e.location.replace(/[\r\n,;]/g, ' ')}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}
function downloadIcs(e: CalendarEvent) {
  const blob = new Blob([makeIcs(e)], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

export function AddToCalendar({ event, className }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLUListElement | null>(null)
  const menuId = useId()

  // Body portal requires `document` — only mount after first render.
  useEffect(() => setMounted(true), [])

  // Anchor the menu to the trigger's bounding rect each frame
  // while it's open. The menu is `position: fixed` so it floats
  // above the event card's `overflow: hidden` boundary and
  // never re-flows the card content. Recomputes on scroll +
  // resize so the menu tracks if the page moves.
  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const tr = triggerRef.current
      if (!tr) return
      const r = tr.getBoundingClientRect()
      const menuW = menuRef.current?.offsetWidth ?? 220
      // Anchor: right edge of menu = right edge of trigger,
      // top of menu = bottom of trigger + 8px gutter.
      const left = Math.max(8, Math.min(window.innerWidth - menuW - 8, r.right - menuW))
      const top = r.bottom + 8
      setPos({ top, left })
    }
    place()
    window.addEventListener('scroll', place, { passive: true, capture: true })
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      const t = e.target as Node
      if (triggerRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={
          className ??
          'inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors'
        }
      >
        <CalendarSvg />
        Add to calendar
      </button>

      {/* Menu is rendered into <body> so it escapes the event
          card's `overflow: hidden` and never re-flows the card. */}
      {mounted && createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.ul
              ref={menuRef}
              id={menuId}
              role="menu"
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                zIndex: 500,
              }}
              className="min-w-[220px] py-1.5 glass-card overflow-hidden"
            >
              <li>
                <a
                  role="menuitem"
                  href={googleUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-text-primary/[0.04] transition-colors"
                >
                  <GoogleSvg /> Google Calendar
                </a>
              </li>
              <li>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => { downloadIcs(event); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-text-primary/[0.04] transition-colors"
                >
                  <AppleSvg /> Apple Calendar (.ics)
                </button>
              </li>
              <li>
                <a
                  role="menuitem"
                  href={outlookUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-text-primary/[0.04] transition-colors"
                >
                  <OutlookSvg /> Outlook
                </a>
              </li>
            </motion.ul>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
