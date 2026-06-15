'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import type { EventRow } from '@/lib/schemas/events'
import { CategoryBadge, ModeBadge, formatEventDate, formatTime, durationLabel } from './EventBadges'
import { JoinEventButton } from './JoinEventButton'

interface Props {
  event: EventRow
  open: boolean
  onClose: () => void
  isAuthed: boolean
  registered: boolean
  attended?: boolean
  certUrl?: string | null
}

export function EventDetailPopup({ event, open, onClose, isAuthed, registered, attended, certUrl }: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const ended = new Date(event.ends_at).getTime() < Date.now()
  const cancelled = event.status === 'cancelled'

  return createPortal(
    <div className="fixed inset-0 z-[700] modal-backdrop backdrop-blur-[12px]" role="dialog" aria-modal="true" aria-label={event.title}>
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-1/2 flex flex-col"
        style={{
          width: 'min(600px, calc(100vw - 48px))',
          maxHeight: 'calc(100vh - 48px)',
          transform: 'translate(-50%, -50%)',
          background: 'var(--card-glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)', borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        }}
      >
        {/* Banner */}
        <div className="relative shrink-0" style={{ height: 180, background: 'var(--bg-input)' }}>
          {event.banner_url && (
            <Image
              src={event.banner_url} alt="" fill
              sizes="600px"
              className="object-cover"
            />
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <CategoryBadge category={event.category} />
          </div>
          <div className="absolute top-3 right-14">
            <ModeBadge mode={event.mode} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 rounded-full flex items-center justify-center text-text-primary hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            style={{ width: 36, height: 36, background: 'rgba(0,0,0,0.55)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ padding: 28 }}>
          <h2 className="text-text-primary" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.3 }}>
            {event.title}
          </h2>

          <div className="mt-4 flex flex-col gap-2">
            <Row icon={<CalendarIcon />} text={`${formatEventDate(event.starts_at)} — ${formatTime(event.ends_at)}`} />
            <Row icon={<ClockIcon />} text={durationLabel(event.starts_at, event.ends_at)} muted />
            <Row
              icon={event.mode === 'online' ? <LinkIcon /> : <PinIcon />}
              text={
                event.location_link ? (
                  <a href={event.location_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-link)' }}>
                    {event.location_title} {event.mode === 'online' ? '↗' : '— View on Maps →'}
                  </a>
                ) : event.location_title
              }
            />
          </div>

          <p className="text-text-secondary mt-5" style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {event.description}
          </p>

          {/* Removed: seats remaining computed elsewhere if needed */}
          {event.cert_enabled && (
            <div
              className="mt-5 flex items-center gap-3"
              style={{
                background: 'rgba(45,127,249,0.12)', border: '1px solid rgba(45,127,249,0.35)',
                padding: '12px 16px', borderRadius: 12,
              }}
            >
              <ShieldIcon />
              <span className="text-text-secondary" style={{ fontSize: 14 }}>
                Certificate of participation available for attendees
              </span>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-6">
            {cancelled ? (
              <div
                className="flex items-center justify-center"
                style={{
                  background: 'rgba(239,68,68,0.15)', color: '#EF4444',
                  border: '1px solid rgba(239,68,68,0.4)',
                  height: 52, borderRadius: 999, fontSize: 15, fontWeight: 500,
                }}
              >
                This event has been cancelled
              </div>
            ) : ended ? (
              <div className="flex flex-col gap-3">
                <div
                  className="flex items-center justify-center text-text-tertiary"
                  style={{
                    background: 'var(--bg-surface-elevated)', height: 52,
                    borderRadius: 999, fontSize: 15, fontWeight: 500,
                  }}
                >
                  This event has ended
                </div>
                {attended && certUrl && (
                  <a
                    href={certUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                    style={{
                      display: 'inline-block', height: 52, lineHeight: '52px',
                      borderRadius: 999, background: 'var(--accent-primary)', color: '#fff',
                      fontSize: 16, fontWeight: 600,
                    }}
                  >
                    Download Certificate
                  </a>
                )}
              </div>
            ) : (
              <JoinEventButton event={event} initialRegistered={registered} isAuthed={isAuthed} />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Row({ icon, text, muted = false }: { icon: React.ReactNode; text: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3" style={{ color: muted ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}>
      <span style={{ display: 'inline-flex', width: 18, justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: 15 }}>{text}</span>
    </div>
  )
}

function CalendarIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>
}
function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
}
function LinkIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1"/><path d="M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1"/></svg>
}
function PinIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
}
function ShieldIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D7FF9" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"/><path d="M9 12l2 2 4-4"/></svg>
}
