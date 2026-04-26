import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })

  // Always return 200 — never reveal whether an email exists in a different response code
  return NextResponse.json({ exists: !!existing })
}
