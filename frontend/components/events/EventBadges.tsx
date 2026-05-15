import { CATEGORY_COLOURS, CATEGORY_LABELS, type EventCategory, type EventMode } from '@/lib/schemas/events'

export function CategoryBadge({ category, size = 'md' }: { category: EventCategory; size?: 'sm' | 'md' }) {
  const fontSize = size === 'sm' ? 11 : 12
  const padding = size === 'sm' ? '4px 10px' : '5px 12px'
  return (
    <span
      style={{
        background: CATEGORY_COLOURS[category],
        color: '#ffffff',
        padding,
        borderRadius: 999,
        fontSize,
        fontWeight: 500,
        letterSpacing: 0.2,
        display: 'inline-block',
        lineHeight: 1.2,
      }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  )
}

export function ModeBadge({ mode, size = 'md' }: { mode: EventMode; size?: 'sm' | 'md' }) {
  const fontSize = size === 'sm' ? 11 : 12
  const padding = size === 'sm' ? '4px 10px' : '5px 12px'
  const isOnline = mode === 'online'
  return (
    <span
      style={{
        background: isOnline ? 'rgba(45,127,249,0.18)' : 'rgba(16,185,129,0.18)',
        color: isOnline ? '#2D7FF9' : '#10B981',
        border: `1px solid ${isOnline ? 'rgba(45,127,249,0.4)' : 'rgba(16,185,129,0.4)'}`,
        padding,
        borderRadius: 999,
        fontSize,
        fontWeight: 500,
        letterSpacing: 0.2,
        display: 'inline-block',
        lineHeight: 1.2,
      }}
    >
      {isOnline ? 'Online' : 'Physical'}
    </span>
  )
}

export function StatusBadge({ status }: { status: 'completed' | 'cancelled' }) {
  const colours = status === 'completed'
    ? { bg: 'rgba(16,185,129,0.18)', fg: '#10B981', border: 'rgba(16,185,129,0.4)' }
    : { bg: 'rgba(239,68,68,0.18)', fg: '#EF4444', border: 'rgba(239,68,68,0.4)' }
  return (
    <span
      style={{
        background: colours.bg, color: colours.fg, border: `1px solid ${colours.border}`,
        padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
        letterSpacing: 0.2, display: 'inline-block', lineHeight: 1.2,
      }}
    >
      {status === 'completed' ? 'Completed' : 'Cancelled'}
    </span>
  )
}

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function durationLabel(starts: string, ends: string): string {
  const ms = new Date(ends).getTime() - new Date(starts).getTime()
  const totalMin = Math.round(ms / 60000)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
