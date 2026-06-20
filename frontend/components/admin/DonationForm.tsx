'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateDonationAction } from '@/lib/admin/donation-actions'
import type { DonationIntentRow, DonationStatus, PaymentMethod } from '@/lib/schemas/donations'

interface Props {
  initial: DonationIntentRow
}

const STATUSES: DonationStatus[] = ['pending', 'verified', 'rejected']
const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: null, label: 'Unknown' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'Easypaisa' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
]

export function DonationForm({ initial }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const fd = new FormData(e.currentTarget)
    const amount = Number(fd.get('amount'))
    const extractedRaw = fd.get('extracted_amount')
    const extracted_amount =
      typeof extractedRaw === 'string' && extractedRaw.trim()
        ? Number(extractedRaw)
        : null

    try {
      await updateDonationAction({
        id: initial.id,
        amount,
        currency: String(fd.get('currency') || 'PKR'),
        transaction_id: String(fd.get('transaction_id') || '') || null,
        extracted_amount: Number.isFinite(extracted_amount as number) ? extracted_amount : null,
        payment_method: (String(fd.get('payment_method') || '') || null) as PaymentMethod,
        status: fd.get('status') as DonationStatus,
        admin_notes: String(fd.get('admin_notes') || '') || null,
        ocr_text: String(fd.get('ocr_text') || '') || null,
      })
      router.push('/admin/donations')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error && (
        <p className="text-text-error text-sm" role="alert">{error}</p>
      )}

      <Field label="Amount (PKR)">
        <input name="amount" type="number" min={100} max={5000} step={1} defaultValue={initial.amount} required className={inputClass} />
      </Field>

      <Field label="Currency">
        <input name="currency" type="text" defaultValue={initial.currency} required className={inputClass} />
      </Field>

      <Field label="Transaction ID">
        <input name="transaction_id" type="text" defaultValue={initial.transaction_id ?? ''} className={inputClass} />
      </Field>

      <Field label="Amount from receipt (OCR)">
        <input
          name="extracted_amount"
          type="number"
          step="0.01"
          defaultValue={initial.extracted_amount ?? ''}
          className={inputClass}
        />
      </Field>

      <Field label="Payment method">
        <select name="payment_method" defaultValue={initial.payment_method ?? ''} className={inputClass}>
          {METHODS.map((m) => (
            <option key={m.label} value={m.value ?? ''}>{m.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Status">
        <select name="status" defaultValue={initial.status} className={inputClass}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field label="Admin notes">
        <textarea name="admin_notes" rows={3} defaultValue={initial.admin_notes ?? ''} className={inputClass} />
      </Field>

      <Field label="OCR text (from screenshot)">
        <textarea name="ocr_text" rows={8} defaultValue={initial.ocr_text ?? ''} className={inputClass} />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-50"
          style={{
            height: 44, padding: '0 22px', borderRadius: 999, background: 'var(--accent-primary)',
            color: '#fff', fontSize: 14, fontWeight: 600,
          }}
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-text-secondary text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl px-4 py-3 text-sm text-text-primary bg-bg-surface border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-accent-primary'
