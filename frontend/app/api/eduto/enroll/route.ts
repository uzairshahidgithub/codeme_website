import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SubmitEnrollmentSchema } from '@/lib/schemas/enrollments'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = SubmitEnrollmentSchema.safeParse(body)
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    return NextResponse.json({ error: msg ?? 'Invalid enrollment' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('course_enrollments')
    .insert({
      ...parsed.data,
      user_id: user?.id ?? null,
      status: 'pending',
    })
    .select('id, payment_id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This payment ID is already registered' }, { status: 409 })
    }
    console.error('course_enrollments insert failed:', error.message)
    return NextResponse.json(
      { error: 'Could not save enrollment. Run migration 20260522000000_report_phase1.sql in Supabase.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, id: data.id, payment_id: data.payment_id })
}
