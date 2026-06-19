/**
 * Mailjet v3.1 transactional send — Deno (Edge Functions).
 * Credentials: MAILJET_API_KEY + MAILJET_SECRET_KEY, or SMTP_USER + SMTP_PASS.
 */

export interface SendMailInput {
  to: string
  subject: string
  html: string
  text?: string
  fromEmail?: string
  fromName?: string
}

export interface SendMailResult {
  messageId?: string | number
  transport: 'mailjet-api' | 'smtp'
}

function getMailjetCredentials(): { apiKey: string; secretKey: string } | null {
  const apiKey = Deno.env.get('MAILJET_API_KEY') ?? Deno.env.get('SMTP_USER')
  const secretKey = Deno.env.get('MAILJET_SECRET_KEY') ?? Deno.env.get('SMTP_PASS')
  if (!apiKey || !secretKey) return null
  return { apiKey, secretKey }
}

function defaultFrom() {
  return {
    email: Deno.env.get('EMAIL_FROM') ?? Deno.env.get('MAILJET_FROM_EMAIL') ?? 'noreply@codemoteam.org',
    name: Deno.env.get('EMAIL_FROM_NAME') ?? Deno.env.get('MAILJET_FROM_NAME') ?? 'Codemo Teams',
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function sendTransactionalEmail(input: SendMailInput): Promise<SendMailResult> {
  const creds = getMailjetCredentials()
  if (!creds) {
    throw new Error('Mailjet is not configured (set MAILJET_API_KEY and MAILJET_SECRET_KEY)')
  }

  const from = defaultFrom()
  const fromEmail = input.fromEmail ?? from.email
  const fromName = input.fromName ?? from.name

  const auth = btoa(`${creds.apiKey}:${creds.secretKey}`)
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: fromEmail, Name: fromName },
          To: [{ Email: input.to }],
          Subject: input.subject,
          HTMLPart: input.html,
          TextPart: input.text ?? stripHtml(input.html),
        },
      ],
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Mailjet API ${res.status}: ${detail}`)
  }

  const json = await res.json() as {
    Messages?: Array<{ To?: Array<{ MessageID?: number }> }>
  }

  return {
    messageId: json.Messages?.[0]?.To?.[0]?.MessageID,
    transport: 'mailjet-api',
  }
}

/** SMTP fallback when API keys are absent but legacy SMTP_* vars are set. */
export async function sendViaSmtpFallback(input: SendMailInput): Promise<SendMailResult> {
  const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts')

  const host = Deno.env.get('SMTP_HOST')
  const portRaw = Deno.env.get('SMTP_PORT') ?? '587'
  const username = Deno.env.get('SMTP_USER')
  const password = Deno.env.get('SMTP_PASS')
  const from = defaultFrom()

  if (!host || !username || !password) {
    throw new Error('SMTP is not configured')
  }

  const port = Number.parseInt(portRaw, 10)
  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username, password },
    },
  })

  try {
    await client.send({
      from: input.fromEmail ?? from.email,
      to: input.to,
      subject: input.subject,
      content: input.text ?? stripHtml(input.html),
      html: input.html,
    })
  } finally {
    try { await client.close() } catch { /* noop */ }
  }

  return { transport: 'smtp' }
}

export async function sendEmail(input: SendMailInput): Promise<SendMailResult> {
  if (getMailjetCredentials()) {
    return sendTransactionalEmail(input)
  }
  return sendViaSmtpFallback(input)
}
