'use client'

import { useState } from 'react'
import type { EventRow } from '@/lib/schemas/events'
import { EventCalendar } from './EventCalendar'
import { EventsTable } from './EventsTable'

type Tab = 'calendar' | 'upcoming' | 'past'

interface Props {
  upcoming: EventRow[]
  past: EventRow[]
  allForCalendar: EventRow[]
  isAuthed: boolean
  registeredIds: string[]
  attendedMap: Record<string, { attended: boolean; cert_url: string | null }>
}

export function EventsTabs({ upcoming, past, allForCalendar, isAuthed, registeredIds, attendedMap }: Props) {
  const [tab, setTab] = useState<Tab>('calendar')
  const regSet = new Set(registeredIds)

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <TabBtn active={tab === 'calendar'} onClick={() => setTab('calendar')}>Calendar</TabBtn>
        <TabBtn active={tab === 'upcoming'} onClick={() => setTab('upcoming')}>Upcoming Events</TabBtn>
        <TabBtn active={tab === 'past'} onClick={() => setTab('past')}>Past Events</TabBtn>
      </div>

      {tab === 'calendar' && (
        <EventCalendar events={allForCalendar} isAuthed={isAuthed} registeredIds={regSet} />
      )}
      {tab === 'upcoming' && (
        <EventsTable events={upcoming} variant="upcoming" isAuthed={isAuthed} registeredIds={regSet} />
      )}
      {tab === 'past' && (
        <EventsTable
          events={past} variant="past" isAuthed={isAuthed}
          registeredIds={regSet} attendedMap={attendedMap}
        />
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      style={{
        height: 44, padding: '0 24px', borderRadius: 999,
        background: active ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontSize: 14, fontWeight: 500,
        border: '1px solid ' + (active ? 'var(--accent-primary)' : 'var(--border)'),
        transition: 'background 160ms ease',
      }}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}
