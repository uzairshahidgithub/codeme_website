import { NextResponse } from 'next/server'

/** @deprecated Use POST /api/donations/submit with multipart screenshot upload. */
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Upload via POST /api/donations/submit.' },
    { status: 410 },
  )
}
