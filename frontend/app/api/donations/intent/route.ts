import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface IntentBody {
  amount?: unknown
  currency?: unknown
  ocr_text?: unknown
  transaction_id?: unknown
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as IntentBody | null
  if (!body) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }
  const amount = typeof body.amount === 'number' ? body.amount : NaN
  if (!Number.isFinite(amount) || amount < 100 || amount > 5000) {
    return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
  }
  const ocr_text = typeof body.ocr_text === 'string' ? body.ocr_text : null
  const transaction_id = typeof body.transaction_id === 'string' ? body.transaction_id : null
  const currency = typeof body.currency === 'string' ? body.currency : 'PKR'

  const supabase = await createClient()
  const { error } = await supabase.from('donation_intents').insert({
    amount,
    currency,
    ocr_text,
    transaction_id,
    status: 'pending',
  })
  // Graceful degrade: if the table doesn't exist yet, finish the user flow
  // anyway so the UX doesn't break. Admin can wire the schema later.
  if (error) {
    console.warn('donation_intents insert failed:', error.message)
    return NextResponse.json({ ok: true, persisted: false }, { status: 202 })
  }
  return NextResponse.json({ ok: true, persisted: true })
}
