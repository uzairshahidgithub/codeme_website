import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const querySchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/)

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  const parsed = querySchema.safeParse(q)

  if (!parsed.success) {
    return NextResponse.json(
      { available: false, error: 'Invalid username format' },
      { status: 400 },
    )
  }

  const supabase = createAdminClient()
  const { data } = await supabase.auth.admin.listUsers()

  const taken = (data?.users ?? []).some(
    (u) =>
      (u.user_metadata?.username as string | undefined)?.toLowerCase() ===
      parsed.data.toLowerCase(),
  )

  return NextResponse.json({ available: !taken })
}
