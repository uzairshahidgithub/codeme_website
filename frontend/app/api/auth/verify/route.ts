import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyRecaptcha } from '@/lib/recaptcha'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6).regex(/^\d+$/),
  recaptchaToken: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { email, code, recaptchaToken } = parsed.data

  const captchaOk = await verifyRecaptcha(recaptchaToken)
  if (!captchaOk) {
    return NextResponse.json(
      { error: 'reCAPTCHA verification failed' },
      { status: 403 },
    )
  }

  const token = await db.verificationToken.findFirst({
    where: {
      email,
      token: code,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })

  if (!token) {
    return NextResponse.json(
      { error: 'Invalid or expired code' },
      { status: 400 },
    )
  }

  await db.verificationToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  })

  return NextResponse.json({ verified: true })
}
