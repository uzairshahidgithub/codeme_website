'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { EventRow } from '@/lib/schemas/events'
import { AddToCalendar } from './AddToCalendar'

interface Props {
  event: EventRow
  initialRegistered: boolean
  isAuthed: boolean
}

export function JoinEventButton({ event, initialRegistered, isAuthed }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [registered, setRegistered] = useState(initialRegistered)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live-refresh registered state if auth changes underneath
  useEffect(() => { setRegistered(initialRegistered) }, [initialRegistered])

  async function join() {
    if (!isAuthed) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/events?event=${event.id}`)}`)
      return
    }
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/events?event=${event.id}`)}`)
      return
    }
    const { error: insertError } = await supabase
      .from('event_registrations')
      .insert({ event_id: event.id, user_id: user.id })
    setLoading(false)
    if (insertError) {
      setError(insertError.message.includes('duplicate') ? "You're already registered" : 'Failed to register')
      return
    }
    setRegistered(true)
  }

  if (registered) {
    return (
      <div className="flex flex-col gap-3">
        <div
          className="flex items-center justify-center gap-2"
          style={{
            background: 'rgba(16,185,129,0.15)', color: '#10B981',
            border: '1px solid rgba(16,185,129,0.4)',
            height: 48, borderRadius: 999, fontSize: 14, fontWeight: 500,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          You&apos;re registered
        </div>
        <AddToCalendar event={event} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={join}
        disabled={loading}
        aria-label={loading ? 'Joining event' : 'Join this event'}
        className="alive-trigger alive-primary w-full text-base font-semibold text-white rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ height: 52, background: 'var(--accent-primary)' }}
      >
        {loading ? 'Joining…' : 'Join Event'}
      </button>
      {error && <p className="text-text-error text-center" style={{ fontSize: 13 }}>{error}</p>}
    </div>
  )
}
