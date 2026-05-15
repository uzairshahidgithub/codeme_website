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
 * Sends a transactional email via the `send-email` Edge Function (self-hosted Postal SMTP backend).
 *
 * Supabase Auth's own emails (signup confirmation, password recovery, magic link,
 * email change) are sent automatically by Supabase via the configured custom SMTP
 * relay — this helper is only for app-level emails we trigger ourselves
 * (e.g. welcome message, account-event notifications).
 *
 * Caller must be authenticated; the function rejects unauthenticated requests.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { data: null, error: 'Not authenticated', meta: {} }
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
