import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { DonationForm } from '@/components/admin/DonationForm'
import type { DonationIntentRow } from '@/lib/schemas/donations'

interface PageProps { params: Promise<{ id: string }> }

const SELECT =
  'id, user_id, amount, currency, ocr_text, transaction_id, extracted_amount, payment_method, status, admin_notes, created_at, updated_at'

export default async function EditDonationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: row } = await supabase.from('donation_intents').select(SELECT).eq('id', id).single()
  if (!row) notFound()

  const donation = row as DonationIntentRow

  return (
    <div className="px-6 md:px-10 py-8 max-w-[720px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · donations · review</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Review donation</h1>
        <p className="text-text-tertiary mt-1 text-sm">
          Submitted {new Date(donation.created_at).toLocaleString('en-PK')}
        </p>
      </header>
      <DonationForm initial={donation} />
    </div>
  )
}
