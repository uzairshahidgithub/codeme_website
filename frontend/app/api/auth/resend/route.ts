import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { resendRateLimit, resendHourlyRateLimit, checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const schema = z.object({ email: z.string().email() })

function generateCode(): string {
  // Hardcoded for testing
  return '123456'
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const { email } = parsed.data

  // 1 per 60s per email
  const perMinute = await checkRateLimit(resendRateLimit, email)
  if (!perMinute.success) {
    return NextResponse.json(
      { error: 'Please wait before requesting another code' },
      { status: 429 },
    )
  }

  // 5 per hour per email
  const perHour = await checkRateLimit(resendHourlyRateLimit, email)
  if (!perHour.success) {
    return NextResponse.json(
      { error: 'Too many resend attempts. Try again later.' },
      { status: 429 },
    )
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  // Invalidate any existing unused tokens for this email
  await db.verificationToken.updateMany({
    where: { email, usedAt: null },
    data: { usedAt: new Date() },
  })

  await db.verificationToken.create({
    data: { email, token: code, expiresAt },
  })

  await sendVerificationEmail(email, code)

  return NextResponse.json({ sent: true })
}
