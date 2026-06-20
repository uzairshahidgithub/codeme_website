import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SubmitDonationSchema } from '@/lib/schemas/donations'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/jpg', 'image/webp'])

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const parsed = SubmitDonationSchema.safeParse({
    donor_name: form.get('donor_name'),
    donor_email: form.get('donor_email') || undefined,
    donor_phone: form.get('donor_phone') || undefined,
    donor_notes: form.get('donor_notes') || undefined,
    amount: Number(form.get('amount')),
    currency: form.get('currency') || 'PKR',
    transaction_id: form.get('transaction_id'),
    payment_method: form.get('payment_method'),
  })

  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return NextResponse.json({ error: msg ?? 'Invalid donation details' }, { status: 400 })
  }

  const receipt = form.get('receipt')
  if (!(receipt instanceof File) || receipt.size === 0) {
    return NextResponse.json({ error: 'Receipt screenshot is required' }, { status: 400 })
  }

  const contentType = (receipt.type || '').toLowerCase()
  if (!ALLOWED.has(contentType)) {
    return NextResponse.json({ error: 'Receipt must be PNG or JPEG' }, { status: 400 })
  }
  if (receipt.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Receipt must be 5 MB or smaller' }, { status: 400 })
  }

  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  const receiptPath = `receipts/${randomUUID()}.${ext}`

  const admin = createAdminClient()
  const receiptBuffer = Buffer.from(await receipt.arrayBuffer())
  const { error: uploadError } = await admin.storage
    .from('donation-receipts')
    .upload(receiptPath, receiptBuffer, { contentType, upsert: false })

  if (uploadError) {
    console.error('donation receipt upload failed:', uploadError.message)
    return NextResponse.json(
      { error: 'Could not upload receipt. Run migration 20260521000000_donation_manual_fields.sql in Supabase.' },
      { status: 500 },
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const fields = parsed.data

  const { data, error } = await supabase
    .from('donation_intents')
    .insert({
      user_id: user?.id ?? null,
      donor_name: fields.donor_name,
      donor_email: fields.donor_email || null,
      donor_phone: fields.donor_phone || null,
      donor_notes: fields.donor_notes || null,
      amount: fields.amount,
      currency: fields.currency,
      transaction_id: fields.transaction_id,
      payment_method: fields.payment_method,
      receipt_path: receiptPath,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    await admin.storage.from('donation-receipts').remove([receiptPath])
    console.error('donation_intents insert failed:', error.message)
    return NextResponse.json(
      { error: 'Could not save donation. Run migration 20260520000000_donation_intents.sql in Supabase.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, id: data.id })
}
