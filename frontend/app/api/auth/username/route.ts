import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

  const existing = await db.user.findUnique({
    where: { username: parsed.data },
    select: { id: true },
  })

  return NextResponse.json({ available: !existing })
}
