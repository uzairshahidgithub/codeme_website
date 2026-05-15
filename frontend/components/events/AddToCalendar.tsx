'use client'

import { useState, useRef, useEffect } from 'react'
import { createEvent } from 'ics'
import type { EventRow } from '@/lib/schemas/events'

function toGcalUTC(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '')
}

function googleHref(event: EventRow): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toGcalUTC(event.starts_at)}/${toGcalUTC(event.ends_at)}`,
    details: `${event.description}\n\n${event.location_link ?? ''}`.trim(),
    location: event.location_title,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function outlookHref(event: EventRow): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: new Date(event.starts_at).toISOString(),
    enddt: new Date(event.ends_at).toISOString(),
    body: `${event.description}\n\n${event.location_link ?? ''}`.trim(),
    location: event.location_title,
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

function downloadIcs(event: EventRow) {
  const start = new Date(event.starts_at)
  const end = new Date(event.ends_at)
  createEvent(
    {
      title: event.title,
      description: event.description,
      location: event.location_link || event.location_title,
      start: [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()],
      end:   [end.getUTCFullYear(),   end.getUTCMonth() + 1,   end.getUTCDate(),   end.getUTCHours(),   end.getUTCMinutes()],
      startInputType: 'utc',
      endInputType:   'utc',
    },
    (err, value) => {
      if (err || !value) return
      const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${event.title.replace(/[^\w\d-]+/g, '-').slice(0, 60)}.ics`
      a.click()
      URL.revokeObjectURL(url)
    },
  )
}

export function AddToCalendar({ event }: { event: EventRow }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        style={{
          height: 48, borderRadius: 999, background: 'var(--bg-surface-elevated)',
          color: 'var(--text-primary)', fontSize: 15, fontWeight: 500, border: '1px solid var(--border)',
        }}
      >
        Add to Calendar
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 mt-2 z-[100] flex flex-col"
          style={{
            background: 'var(--card-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)', borderRadius: 16, padding: 8,
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          }}
        >
          <a
            href={googleHref(event)} target="_blank" rel="noopener noreferrer" role="menuitem"
            className="text-text-primary hover:bg-white/[0.04] flex items-center gap-3"
            style={{ padding: '12px 14px', borderRadius: 10, fontSize: 14 }}
            onClick={() => setOpen(false)}
          >
            Google Calendar
          </a>
          <button
            type="button" role="menuitem"
            onClick={() => { downloadIcs(event); setOpen(false) }}
            className="text-text-primary hover:bg-white/[0.04] flex items-center gap-3 text-left"
            style={{ padding: '12px 14px', borderRadius: 10, fontSize: 14, background: 'transparent' }}
          >
            Apple Calendar (.ics)
          </button>
          <a
            href={outlookHref(event)} target="_blank" rel="noopener noreferrer" role="menuitem"
            className="text-text-primary hover:bg-white/[0.04] flex items-center gap-3"
            style={{ padding: '12px 14px', borderRadius: 10, fontSize: 14 }}
            onClick={() => setOpen(false)}
          >
            Outlook Calendar
          </a>
          <button
            type="button" role="menuitem"
            onClick={() => { downloadIcs(event); setOpen(false) }}
            className="text-text-primary hover:bg-white/[0.04] flex items-center gap-3 text-left"
            style={{ padding: '12px 14px', borderRadius: 10, fontSize: 14, background: 'transparent' }}
          >
            Other (.ics download)
          </button>
        </div>
      )}
      <p
        className="text-text-muted italic mt-2 text-center"
        style={{ fontSize: 12, fontFamily: 'var(--font-poppins, Poppins, sans-serif)' }}
      >
        Adding to your calendar confirms your place at this event.
      </p>
    </div>
  )
}
