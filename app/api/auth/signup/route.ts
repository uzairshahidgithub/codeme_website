import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { signupPayloadSchema } from '@/lib/validations/auth'
import argon2 from 'argon2'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = signupPayloadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid signup data', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { email, password, dob, username, gender, domain, status } =
    parsed.data

  // Check if user already exists
  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { id: true, email: true, username: true },
  })

  if (existing?.email === email) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 },
    )
  }

  if (existing?.username === username) {
    return NextResponse.json(
      { error: 'This username is already taken' },
      { status: 409 },
    )
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 1,
  })

  const dobDate = new Date(dob)
  const firstName = email.split('@')[0] // fallback — frontend should send name from profile setup

  await db.user.create({
    data: {
      email,
      emailVerified: new Date(),
      passwordHash,
      username,
      firstName,
      dob: dobDate,
      gender,
      domain,
      status,
    },
  })

  await db.auditLog.create({
    data: { action: 'user.signup', metadata: { email, username } },
  })

  return NextResponse.json({ created: true }, { status: 201 })
}
