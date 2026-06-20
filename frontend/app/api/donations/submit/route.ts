import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractReceiptText } from '@/lib/donations/ocr-server'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/jpg'])

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const amountRaw = form.get('amount')
  const amount = typeof amountRaw === 'string' ? Number(amountRaw) : NaN
  if (!Number.isFinite(amount) || amount < 100 || amount > 5000) {
    return NextResponse.json({ error: 'Amount must be between Rs. 100 and Rs. 5,000' }, { status: 400 })
  }

  const currencyRaw = form.get('currency')
  const currency = typeof currencyRaw === 'string' && currencyRaw.trim() ? currencyRaw.trim() : 'PKR'

  const screenshot = form.get('screenshot')
  if (!(screenshot instanceof File) || screenshot.size === 0) {
    return NextResponse.json({ error: 'Screenshot is required' }, { status: 400 })
  }

  const contentType = (screenshot.type || '').toLowerCase()
  if (!ALLOWED.has(contentType)) {
    return NextResponse.json({ error: 'Screenshot must be PNG or JPEG' }, { status: 400 })
  }
  if (screenshot.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Screenshot must be 5 MB or smaller' }, { status: 400 })
  }

  let ocr
  try {
    ocr = await extractReceiptText(screenshot)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OCR failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('donation_intents')
    .insert({
      user_id: user?.id ?? null,
      amount,
      currency,
      ocr_text: ocr.text || null,
      transaction_id: ocr.transaction_id,
      extracted_amount: ocr.extracted_amount,
      payment_method: ocr.payment_method,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('donation_intents insert failed:', error.message)
    return NextResponse.json(
      { error: 'Could not save donation. Run migration 20260520000000_donation_intents.sql in Supabase.' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    transaction_id: ocr.transaction_id,
    extracted_amount: ocr.extracted_amount,
  })
}
