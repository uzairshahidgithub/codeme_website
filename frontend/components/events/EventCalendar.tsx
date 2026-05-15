'use client'

import { useEffect, useMemo, useState } from 'react'
import { RRule, RRuleSet, rrulestr } from 'rrule'
import type { EventRow } from '@/lib/schemas/events'
import { CATEGORY_COLOURS } from '@/lib/schemas/events'
import { CategoryBadge, ModeBadge, formatTime } from './EventBadges'
import { EventDetailPopup } from './EventDetailPopup'

interface Props {
  events: EventRow[]
  isAuthed: boolean
  registeredIds: Set<string>
}

interface ExpandedOccurrence {
  event: EventRow
  date: Date
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function expandRecurringEvents(events: EventRow[], rangeStart: Date, rangeEnd: Date): ExpandedOccurrence[] {
  const out: ExpandedOccurrence[] = []
  for (const e of events) {
    if (!e.is_recurring || !e.recurrence_rule) {
      out.push({ event: e, date: new Date(e.starts_at) })
      continue
    }
    try {
      const ruleStr = e.recurrence_rule.toUpperCase().startsWith('RRULE:')
        ? e.recurrence_rule
        : `RRULE:${e.recurrence_rule}`
      const rule = rrulestr(ruleStr, { dtstart: new Date(e.starts_at) }) as RRule | RRuleSet
      const occurrences = rule.between(rangeStart, rangeEnd, true)
      for (const d of occurrences) out.push({ event: e, date: d })
      if (occurrences.length === 0) out.push({ event: e, date: new Date(e.starts_at) })
    } catch {
      out.push({ event: e, date: new Date(e.starts_at) })
    }
  }
  return out
}

export function EventCalendar({ events, isAuthed, registeredIds }: Props) {
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(startOfMonth(today))
  const [selected, setSelected] = useState<Date | null>(today)
  const [popupEvent, setPopupEvent] = useState<EventRow | null>(null)

  const cells = useMemo(() => {
    const first = startOfMonth(cursor)
    const last = endOfMonth(cursor)
    const offsetStart = (first.getDay() + 6) % 7
    const gridStart = new Date(first); gridStart.setDate(first.getDate() - offsetStart)
    const offsetEnd = (7 - ((last.getDay() + 6) % 7) - 1)
    const gridEnd = new Date(last); gridEnd.setDate(last.getDate() + offsetEnd)
    const days: Date[] = []
    for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) days.push(new Date(d))
    while (days.length < 42) {
      const next = new Date(days[days.length - 1]); next.setDate(next.getDate() + 1)
      days.push(next)
    }
    return days
  }, [cursor])

  const rangeStart = cells[0]
  const rangeEnd = cells[cells.length - 1]
  const occurrences = useMemo(
    () => expandRecurringEvents(events, rangeStart, rangeEnd),
    [events, rangeStart, rangeEnd],
  )

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, ExpandedOccurrence[]>()
    for (const o of occurrences) {
      const key = `${o.date.getFullYear()}-${o.date.getMonth()}-${o.date.getDate()}`
      const arr = map.get(key) ?? []
      arr.push(o)
      map.set(key, arr)
    }
    return map
  }, [occurrences])

  const selectedKey = selected ? `${selected.getFullYear()}-${selected.getMonth()}-${selected.getDate()}` : ''
  const selectedOccurrences = selected ? occurrencesByDay.get(selectedKey) ?? [] : []

  return (
    <>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Calendar surface */}
        <div
          style={{
            background: 'var(--bg-surface)', borderRadius: 24, padding: 28,
            border: '1px solid var(--border)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-text-muted" style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {cursor.getFullYear()}
              </span>
              <h2 className="text-text-primary" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
                {MONTH_NAMES[cursor.getMonth()]}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCursor(startOfMonth(today))}
                className="text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                style={{
                  height: 36, padding: '0 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                  background: 'var(--bg-surface-elevated)', border: '1px solid var(--border)',
                }}
              >Today</button>
              <NavBtn dir="prev" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} />
              <NavBtn dir="next" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} />
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-text-muted text-center" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-2">
            {cells.map((d, i) => {
              const isCurrentMonth = d.getMonth() === cursor.getMonth()
              const isToday = sameDay(d, today)
              const isSelected = !!selected && sameDay(d, selected)
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
              const dayOccurrences = occurrencesByDay.get(key) ?? []
              const hasEvents = dayOccurrences.length > 0
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelected(d)}
                  className="relative flex flex-col items-center justify-start group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                  style={{
                    aspectRatio: '1 / 1', minHeight: 56, padding: '8px 0', borderRadius: 14,
                    border: '1px solid ' + (isToday && !isSelected ? 'var(--accent-primary)' : 'transparent'),
                    background: isSelected
                      ? 'var(--accent-primary)'
                      : hasEvents && isCurrentMonth ? 'rgba(45,127,249,0.05)' : 'transparent',
                    color: isSelected ? '#fff' : isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                    opacity: isCurrentMonth ? 1 : 0.32,
                    transition: 'background 220ms ease, transform 220ms ease, border-color 220ms ease',
                  }}
                >
                  <span style={{
                    fontSize: 14,
                    fontWeight: isToday || isSelected ? 600 : 400,
                    lineHeight: 1.2,
                  }}>{d.getDate()}</span>
                  {hasEvents && (
                    <div className="flex gap-1 mt-1.5 items-center">
                      {dayOccurrences.slice(0, 3).map((o, j) => (
                        <span
                          key={j}
                          style={{
                            display: 'inline-block', width: 5, height: 5, borderRadius: 999,
                            background: isSelected ? '#fff' : CATEGORY_COLOURS[o.event.category],
                          }}
                        />
                      ))}
                      {dayOccurrences.length > 3 && (
                        <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.85 }}>+{dayOccurrences.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            {(['webinar', 'bootcamp', 'workshop', 'hackathon'] as const).map((c) => (
              <div key={c} className="flex items-center gap-2 capitalize text-text-tertiary" style={{ fontSize: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: CATEGORY_COLOURS[c], display: 'inline-block' }} />
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Selected day panel */}
        <div
          style={{
            background: 'var(--bg-surface)', borderRadius: 24, padding: 28,
            border: '1px solid var(--border)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
            minHeight: 480,
          }}
        >
          {selected && (
            <>
              <div className="mb-5">
                <span className="text-text-muted" style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  {selected.toLocaleDateString('en-GB', { weekday: 'long' })}
                </span>
                <h3 className="text-text-primary mt-1" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {selected.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' })}
                </h3>
              </div>

              {selectedOccurrences.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center text-center"
                  style={{ padding: '48px 16px' }}
                >
                  <div
                    className="mb-4"
                    style={{
                      width: 56, height: 56, borderRadius: 999,
                      background: 'rgba(45,127,249,0.08)', border: '1px solid rgba(45,127,249,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M3 9h18M8 3v4M16 3v4" />
                    </svg>
                  </div>
                  <p className="text-text-tertiary" style={{ fontSize: 14 }}>No events on this day.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedOccurrences.map((o, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPopupEvent(o.event)}
                      className="w-full text-left flex items-center gap-3 hover:translate-x-1 hover:border-blue-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary group"
                      style={{
                        background: 'var(--bg-surface-elevated)', padding: 14, borderRadius: 14,
                        border: '1px solid var(--border)',
                        transition: 'transform 220ms ease, border-color 220ms ease, background 220ms ease',
                      }}
                    >
                      <span style={{
                        width: 4, alignSelf: 'stretch', borderRadius: 4,
                        background: CATEGORY_COLOURS[o.event.category],
                      }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-text-primary truncate" style={{ fontSize: 15, fontWeight: 600 }}>
                          {o.event.title}
                        </div>
                        <div className="text-text-tertiary mt-1 flex items-center gap-2" style={{ fontSize: 12 }}>
                          <span>{formatTime(o.event.starts_at)}</span>
                          <span>·</span>
                          <span>{o.event.location_title}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <CategoryBadge category={o.event.category} size="sm" />
                        <ModeBadge mode={o.event.mode} size="sm" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {popupEvent && (
        <EventDetailPopup
          event={popupEvent}
          open={!!popupEvent}
          onClose={() => setPopupEvent(null)}
          isAuthed={isAuthed}
          registered={registeredIds.has(popupEvent.id)}
        />
      )}
    </>
  )
}

function NavBtn({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      aria-label={dir === 'prev' ? 'Previous month' : 'Next month'}
      className="rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary transition-colors"
      style={{ width: 36, height: 36, border: '1px solid var(--border)' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={dir === 'prev' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  )
}
