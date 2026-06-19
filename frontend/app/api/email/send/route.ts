import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendMailjetEmail, isMailjetConfigured } from '@/lib/mailjet/server'

const bodySchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(200_000),
  text: z.string().max(200_000).optional(),
})

export async function POST(request: NextRequest) {
  if (!isMailjetConfigured()) {
    return NextResponse.json({ error: 'Mailjet is not configured' }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', fields: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  try {
    const result = await sendMailjetEmail(parsed.data)
    return NextResponse.json({ data: { sent: true, messageId: result.messageId }, error: null })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to send email'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
