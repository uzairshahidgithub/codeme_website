import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase.auth.admin.listUsers()

  const exists = (data?.users ?? []).some(
    (u) => u.email?.toLowerCase() === parsed.data.email.toLowerCase(),
  )

  // Always 200 — never leak user existence via HTTP status codes
  return NextResponse.json({ exists })
}
