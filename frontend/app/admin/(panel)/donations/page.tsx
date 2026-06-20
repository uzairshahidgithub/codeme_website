import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteDonationAction } from '@/lib/admin/donation-actions'
import type { DonationIntentRow, DonationStatus } from '@/lib/schemas/donations'
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton'

export const dynamic = 'force-dynamic'

const SELECT =
  'id, user_id, amount, currency, ocr_text, transaction_id, extracted_amount, payment_method, status, admin_notes, created_at, updated_at'

function statusColour(s: DonationStatus) {
  switch (s) {
    case 'verified': return { bg: 'rgba(16,185,129,0.18)', fg: '#10B981', border: 'rgba(16,185,129,0.4)' }
    case 'rejected': return { bg: 'rgba(239,68,68,0.18)', fg: '#EF4444', border: 'rgba(239,68,68,0.4)' }
    default:         return { bg: 'rgba(245,158,11,0.18)', fg: '#F59E0B', border: 'rgba(245,158,11,0.4)' }
  }
}

function formatPkr(n: number) {
  return `Rs. ${n.toLocaleString('en-PK')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default async function AdminDonationsPage() {
  const supabase = createAdminClient()
  const { data: rows, error } = await supabase
    .from('donation_intents')
    .select(SELECT)
    .order('created_at', { ascending: false })

  const donations = (rows ?? []) as DonationIntentRow[]
  const pending = donations.filter((d) => d.status === 'pending').length

  return (
    <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto w-full">
      <header className="flex items-end justify-between mb-8 gap-6 flex-wrap">
        <div>
          <span className="home-mono-eyebrow">admin · donations</span>
          <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Donations</h1>
          <p className="text-text-tertiary mt-1" style={{ fontSize: 14 }}>
            Manual transfer receipts — OCR text only, screenshots are never stored.
            {pending > 0 && ` · ${pending} pending review`}
          </p>
        </div>
      </header>

      {error && (
        <p className="text-text-error text-sm mb-4">
          Failed to load donations: {error.message}
        </p>
      )}

      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: '1fr 120px 1fr 120px 140px 160px',
            background: 'var(--bg-surface)', padding: '16px 24px', gap: 12,
          }}
        >
          <Cell>Submitted</Cell>
          <Cell>Amount</Cell>
          <Cell>Transaction ID</Cell>
          <Cell>Method</Cell>
          <Cell>Status</Cell>
          <Cell>Actions</Cell>
        </div>

        {donations.map((d) => {
          const colour = statusColour(d.status)
          return (
            <div
              key={d.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr 120px 1fr 120px 140px 160px',
                padding: '14px 24px', gap: 12,
                borderTop: '1px solid var(--border)',
              }}
            >
              <div className="text-text-secondary text-sm">{formatDate(d.created_at)}</div>
              <div className="text-text-primary font-medium text-sm">{formatPkr(Number(d.amount))}</div>
              <div className="text-text-secondary text-sm truncate font-mono">
                {d.transaction_id ?? '—'}
              </div>
              <div className="text-text-secondary text-sm capitalize">{d.payment_method ?? '—'}</div>
              <div>
                <span style={{
                  background: colour.bg, color: colour.fg, border: `1px solid ${colour.border}`,
                  padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, textTransform: 'capitalize',
                }}>{d.status}</span>
              </div>
              <div className="flex gap-3 items-center">
                <Link href={`/admin/donations/${d.id}/edit`} className="text-text-link text-sm">Review</Link>
                <AdminDeleteButton
                  id={d.id}
                  label={d.transaction_id ?? formatPkr(Number(d.amount))}
                  deleteAction={deleteDonationAction}
                />
              </div>
            </div>
          )
        })}

        {donations.length === 0 && (
          <p className="text-text-tertiary text-center py-10 text-sm">No donations submitted yet.</p>
        )}
      </div>
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-text-muted" style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}
