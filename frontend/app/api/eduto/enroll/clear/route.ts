import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { payment_id?: string } | null
  const paymentId = body?.payment_id?.trim()
  if (!paymentId) {
    return NextResponse.json({ error: 'payment_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('course_enrollments')
    .update({ status: 'cleared', cleared_at: new Date().toISOString() })
    .eq('payment_id', paymentId)

  if (error) {
    console.error('course_enrollments clear failed:', error.message)
    return NextResponse.json({ error: 'Could not update enrollment' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
