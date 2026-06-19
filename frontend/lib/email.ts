import { createClient } from '@/lib/supabase/client'

interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
}

interface SendEmailResult {
  data: { id: string } | null
  error: string | null
  meta: Record<string, unknown>
}

/**
 * Sends a transactional email via Mailjet.
 *
 * Tries the Next.js `/api/email/send` route first (server-side Mailjet).
 * Falls back to the `send-email` Edge Function when running in the browser
 * without a same-origin API route.
 *
 * Supabase Auth emails (signup confirmation, password recovery, magic link,
 * OTP codes) are sent automatically by Supabase through Mailjet SMTP configured
 * in the Supabase Dashboard — not through this helper.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated', meta: {} }
  }

  const apiRes = await fetch('/api/email/send', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (apiRes.ok) {
    const payload = (await apiRes.json()) as SendEmailResult
    return payload
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const payload = (await res.json()) as SendEmailResult
  return payload
}
