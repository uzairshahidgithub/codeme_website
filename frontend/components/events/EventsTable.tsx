'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import type { EventRow } from '@/lib/schemas/events'
import { CategoryBadge, ModeBadge, StatusBadge, formatShortDate, formatTime, durationLabel } from './EventBadges'
import { EventDetailPopup } from './EventDetailPopup'

interface Props {
  events: EventRow[]
  variant: 'upcoming' | 'past'
  isAuthed: boolean
  registeredIds: Set<string>
  attendedMap?: Record<string, { attended: boolean; cert_url: string | null }>
}

const PAGE_SIZE = 10

export function EventsTable({ events, variant, isAuthed, registeredIds, attendedMap = {} }: Props) {
  const [page, setPage] = useState(0)
  const [open, setOpen] = useState<EventRow | null>(null)

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE))
  const paged = useMemo(
    () => events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [events, page],
  )

  if (events.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{
          background: 'var(--bg-surface)', borderRadius: 24, padding: '48px 24px',
          border: '1px solid var(--border)',
        }}
      >
        <p className="text-text-secondary" style={{ fontSize: 15 }}>
          {variant === 'upcoming'
            ? 'No upcoming events at the moment. Check back soon.'
            : 'No past events to show yet.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '40% 1fr 1fr 1fr 1fr 1fr 140px',
            background: 'var(--bg-surface)', padding: '16px 24px', gap: 12,
          }}
        >
          <Cell>Event</Cell>
          <Cell>Category</Cell>
          <Cell>Mode</Cell>
          <Cell>Date</Cell>
          <Cell>Duration</Cell>
          <Cell>{variant === 'upcoming' ? 'Seats' : 'Status'}</Cell>
          <Cell>Action</Cell>
        </div>

        {/* Rows */}
        {paged.map((e) => {
          const seatsLeft = e.max_attendees != null ? e.max_attendees : null
          return (
            <div
              key={e.id}
              className="grid items-center hover:bg-white/[0.03] transition-colors"
              style={{
                gridTemplateColumns: '40% 1fr 1fr 1fr 1fr 1fr 140px',
                padding: '0 24px', gap: 12, minHeight: 72,
                borderTop: '1px solid var(--border)',
                opacity: variant === 'past' ? 0.85 : 1,
              }}
            >
              <div className="flex items-center gap-3 min-w-0 py-3">
                <div
                  className="relative shrink-0 overflow-hidden"
                  style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-input)' }}
                >
                  {e.banner_url && (
                    <Image src={e.banner_url} alt="" fill sizes="48px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div
                    className="text-text-primary truncate"
                    style={{ fontSize: 15, fontWeight: 600 }}
                  >
                    {e.title}
                  </div>
                </div>
              </div>
              <div><CategoryBadge category={e.category} size="sm" /></div>
              <div><ModeBadge mode={e.mode} size="sm" /></div>
              <div className="text-text-secondary" style={{ fontSize: 14 }}>
                <div>{formatShortDate(e.starts_at)}</div>
                <div className="text-text-muted" style={{ fontSize: 13 }}>{formatTime(e.starts_at)}</div>
              </div>
              <div className="text-text-muted" style={{ fontSize: 14 }}>
                {durationLabel(e.starts_at, e.ends_at)}
              </div>
              <div style={{ fontSize: 14 }}>
                {variant === 'upcoming' ? (
                  seatsLeft == null ? (
                    <span className="text-text-muted">Unlimited</span>
                  ) : (
                    <span style={{ color: seatsLeft < 10 ? 'var(--text-error)' : 'var(--text-secondary)' }}>
                      {seatsLeft} left
                    </span>
                  )
                ) : (
                  <StatusBadge status={e.status === 'cancelled' ? 'cancelled' : 'completed'} />
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setOpen(e)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  style={{
                    height: 36, padding: '0 18px', borderRadius: 999,
                    background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)',
                    fontSize: 13, fontWeight: 500, border: '1px solid var(--border)',
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <PagerBtn disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} label="Previous" />
          <span className="text-text-muted" style={{ fontSize: 13 }}>
            Page {page + 1} of {totalPages}
          </span>
          <PagerBtn disabled={page + 1 >= totalPages} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} label="Next" />
        </div>
      )}

      {open && (
        <EventDetailPopup
          event={open}
          open={!!open}
          onClose={() => setOpen(null)}
          isAuthed={isAuthed}
          registered={registeredIds.has(open.id)}
          attended={attendedMap[open.id]?.attended}
          certUrl={attendedMap[open.id]?.cert_url}
        />
      )}
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-text-muted"
      style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}
    >
      {children}
    </div>
  )
}

function PagerBtn({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button" disabled={disabled} onClick={onClick}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        height: 36, padding: '0 16px', borderRadius: 999,
        background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)',
        fontSize: 13, fontWeight: 500, border: '1px solid var(--border)',
      }}
    >
      {label}
    </button>
  )
}
