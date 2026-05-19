import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'
import { verifyTurnstileToken } from '@/lib/turnstile'

const schema = z.object({
  email: z.string().email(),
  turnstileToken: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  // Verify Turnstile
  const ip = request.headers.get('x-forwarded-for') || undefined
  const isHuman = await verifyTurnstileToken(parsed.data.turnstileToken || '', ip)
  if (!isHuman) {
    return NextResponse.json({ error: 'Security verification failed' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase.auth.admin.listUsers()

  const exists = (data?.users ?? []).some(
    (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase(),
  )

  // Always 200 — never leak user existence via HTTP status codes
  return NextResponse.json({ exists })
}
