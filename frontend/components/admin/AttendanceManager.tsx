'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Row {
  id: string
  user_id: string
  registered_at: string
  attended: boolean
  cert_issued: boolean
  cert_url: string | null
  name: string
  email: string
}

interface Props {
  eventId: string
  certEnabled: boolean
  rows: Row[]
}

type Filter = 'all' | 'attended' | 'not-attended' | 'cert-issued'

export function AttendanceManager({ eventId, certEnabled, rows: initialRows }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [rows, setRows] = useState(initialRows)
  const [filter, setFilter] = useState<Filter>('all')
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => rows.filter((r) => {
    if (filter === 'attended') return r.attended
    if (filter === 'not-attended') return !r.attended
    if (filter === 'cert-issued') return r.cert_issued
    return true
  }), [rows, filter])

  function setBusyFor(userId: string, on: boolean) {
    setBusy((s) => {
      const next = new Set(s)
      if (on) next.add(userId); else next.delete(userId)
      return next
    })
  }

  async function toggleAttended(row: Row, attended: boolean) {
    setBusyFor(row.user_id, true); setError(null)
    const { data, error } = await supabase.functions.invoke('mark-attendance', {
      body: { event_id: eventId, user_ids: [row.user_id], attended },
    })
    setBusyFor(row.user_id, false)
    if (error || data?.error) {
      setError(error?.message || data?.error || 'Failed to update attendance')
      return
    }
    setRows((rs) => rs.map((r) => r.user_id === row.user_id ? { ...r, attended } : r))
  }

  async function issueCert(row: Row) {
    setBusyFor(row.user_id, true); setError(null)
    const gen = await supabase.functions.invoke('generate-cert', {
      body: { event_id: eventId, user_id: row.user_id },
    })
    if (gen.error || gen.data?.error) {
      setBusyFor(row.user_id, false)
      setError(gen.error?.message || gen.data?.error || 'Failed to generate cert')
      return
    }
    const cert_url = gen.data?.data?.cert_url ?? null
    const send = await supabase.functions.invoke('send-cert-email', {
      body: { event_id: eventId, user_id: row.user_id },
    })
    setBusyFor(row.user_id, false)
    if (send.error || send.data?.error) {
      setError(send.error?.message || send.data?.error || 'Cert created but email failed')
    }
    setRows((rs) => rs.map((r) => r.user_id === row.user_id ? { ...r, cert_issued: true, cert_url } : r))
    startTransition(() => router.refresh())
  }

  async function issueAll() {
    const targets = rows.filter((r) => r.attended && !r.cert_issued)
    if (targets.length === 0) return
    setBulkBusy(true); setError(null)
    for (const r of targets) {
      // sequential to keep cert generation predictable and avoid SMTP burst
      await issueCert(r)
    }
    setBulkBusy(false)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filter row + bulk */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterPill>
          <FilterPill active={filter === 'attended'} onClick={() => setFilter('attended')}>Attended</FilterPill>
          <FilterPill active={filter === 'not-attended'} onClick={() => setFilter('not-attended')}>Not Attended</FilterPill>
          <FilterPill active={filter === 'cert-issued'} onClick={() => setFilter('cert-issued')}>Cert Issued</FilterPill>
        </div>
        {certEnabled && (
          <button
            type="button" onClick={issueAll} disabled={bulkBusy}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-60"
            style={{
              height: 40, padding: '0 18px', borderRadius: 999, background: 'var(--accent-primary)',
              color: '#fff', fontSize: 13, fontWeight: 600,
            }}
          >{bulkBusy ? 'Issuing…' : 'Issue All Certs'}</button>
        )}
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.12)', color: '#EF4444',
          border: '1px solid rgba(239,68,68,0.4)', padding: '12px 16px', borderRadius: 12, fontSize: 13,
        }}>{error}</div>
      )}

      {/* Table */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '2fr 1.4fr 1fr 100px 110px 200px',
            background: 'var(--bg-surface)', padding: '14px 20px', gap: 12,
          }}
        >
          <Cell>User</Cell>
          <Cell>Display Name</Cell>
          <Cell>Registered</Cell>
          <Cell>Attended</Cell>
          <Cell>Cert</Cell>
          <Cell>Action</Cell>
        </div>
        {filtered.length === 0 && (
          <div className="text-text-tertiary text-center" style={{ padding: 32, fontSize: 14, borderTop: '1px solid var(--border)' }}>
            No registrations match this filter.
          </div>
        )}
        {filtered.map((r) => {
          const isBusy = busy.has(r.user_id)
          const canIssue = certEnabled && r.attended && !r.cert_issued
          return (
            <div
              key={r.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '2fr 1.4fr 1fr 100px 110px 200px',
                padding: '12px 20px', gap: 12, borderTop: '1px solid var(--border)',
              }}
            >
              <div className="text-text-primary truncate" style={{ fontSize: 13 }}>{r.email}</div>
              <div className="text-text-secondary truncate" style={{ fontSize: 13 }}>{r.name}</div>
              <div className="text-text-muted" style={{ fontSize: 12 }}>
                {new Date(r.registered_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div>
                <input
                  type="checkbox" checked={r.attended} disabled={isBusy}
                  onChange={(e) => toggleAttended(r, e.target.checked)}
                  className="codemo-checkbox" aria-label={`Mark ${r.name} attended`}
                />
              </div>
              <div className="text-text-muted" style={{ fontSize: 12 }}>
                {r.cert_issued ? (
                  r.cert_url ? <a href={r.cert_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-link)' }}>Issued ↗</a>
                  : <span style={{ color: 'var(--text-link)' }}>Issued</span>
                ) : '—'}
              </div>
              <div>
                {canIssue && (
                  <button
                    type="button" onClick={() => issueCert(r)} disabled={isBusy}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-60"
                    style={{
                      height: 32, padding: '0 14px', borderRadius: 999, background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)', fontSize: 12, fontWeight: 500, border: '1px solid var(--border)',
                    }}
                  >{isBusy ? 'Working…' : 'Issue Cert'}</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-text-muted" style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      style={{
        height: 36, padding: '0 16px', borderRadius: 999, fontSize: 12, fontWeight: 500,
        background: active ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: '1px solid ' + (active ? 'var(--accent-primary)' : 'var(--border)'),
      }}
    >{children}</button>
  )
}
