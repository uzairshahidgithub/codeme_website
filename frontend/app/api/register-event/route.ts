import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfnM19__8lQKh7DAyIruE3WK3KOUjhUPub3GIw60CnNvknDcQ/formResponse'

/**
 * Server-side proxy for Google Forms submission.
 * Bypasses all browser CORS restrictions by making the
 * request from the Node.js runtime instead of the browser.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(body)) {
      params.append(key, String(value))
    }

    const response = await fetch(GOOGLE_FORM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    // Google Forms returns 200 on success
    return NextResponse.json(
      { success: true, status: response.status },
      { status: 200 }
    )
  } catch (error) {
    console.error('Google Form proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Submission failed' },
      { status: 500 }
    )
  }
}
