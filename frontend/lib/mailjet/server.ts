import 'server-only'

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
}

function getConfig() {
  const apiKey = process.env.MAILJET_API_KEY ?? process.env.SMTP_USER
  const secretKey = process.env.MAILJET_SECRET_KEY ?? process.env.SMTP_PASS
  const fromEmail = process.env.MAILJET_FROM_EMAIL ?? process.env.EMAIL_FROM ?? 'noreply@codemoteam.org'
  const fromName = process.env.MAILJET_FROM_NAME ?? process.env.EMAIL_FROM_NAME ?? 'Codemo Teams'

  if (!apiKey || !secretKey) {
    return null
  }

  return { apiKey, secretKey, fromEmail, fromName }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Server-only Mailjet send for Next.js Route Handlers and Server Actions. */
export async function sendMailjetEmail(input: SendMailInput): Promise<SendMailResult> {
  const config = getConfig()
  if (!config) {
    throw new Error('Mailjet is not configured (MAILJET_API_KEY / MAILJET_SECRET_KEY)')
  }

  const auth = Buffer.from(`${config.apiKey}:${config.secretKey}`).toString('base64')
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: input.fromEmail ?? config.fromEmail,
            Name: input.fromName ?? config.fromName,
          },
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

  const json = (await res.json()) as {
    Messages?: Array<{ To?: Array<{ MessageID?: number }> }>
  }

  return { messageId: json.Messages?.[0]?.To?.[0]?.MessageID }
}

export function isMailjetConfigured(): boolean {
  return getConfig() !== null
}
