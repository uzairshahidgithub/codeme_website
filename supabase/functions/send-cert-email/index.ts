import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'
import { corsHeaders, envelope, requireAdmin, audit } from '../_shared/admin.ts'

const bodySchema = z.object({
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
})

serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST')    return envelope(origin, 405, null, 'Method not allowed')

  const auth = await requireAdmin(req, origin, 'admin')
  if (!auth.ok) return auth.response

  let body: unknown
  try { body = await req.json() } catch { return envelope(origin, 400, null, 'Invalid JSON') }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return envelope(origin, 422, null, 'Validation failed', { fields: parsed.error.flatten().fieldErrors })
  }
  const { event_id, user_id } = parsed.data

  const { data: reg } = await auth.serviceClient
    .from('event_registrations')
    .select('cert_url, cert_issued')
    .eq('event_id', event_id)
    .eq('user_id', user_id)
    .single()
  if (!reg?.cert_url || !reg.cert_issued) {
    return envelope(origin, 400, null, 'Certificate has not been generated yet')
  }

  const { data: event } = await auth.serviceClient
    .from('events')
    .select('title')
    .eq('id', event_id)
    .single()
  const eventTitle = event?.title ?? 'Codemo Event'

  const { data: { user }, error: userErr } = await auth.serviceClient.auth.admin.getUserById(user_id)
  if (userErr || !user?.email) return envelope(origin, 404, null, 'Attendee email not found')

  const host = Deno.env.get('SMTP_HOST')
  const port = Number(Deno.env.get('SMTP_PORT') ?? 587)
  const username = Deno.env.get('SMTP_USER')
  const password = Deno.env.get('SMTP_PASS')
  const from = Deno.env.get('EMAIL_FROM') ?? 'noreply@codemoteam.org'
  if (!host || !username || !password) {
    return envelope(origin, 500, null, 'SMTP not configured')
  }

  const client = new SMTPClient({
    connection: { hostname: host, port, tls: port === 465, auth: { username, password } },
  })

  const html = `
    <!doctype html>
    <html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;color:#f5f5f5;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 0;">
        <tr><td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;">
            <tr><td style="padding:32px;">
              <h1 style="margin:0 0 16px 0;font-size:22px;color:#ffffff;">Your certificate is ready</h1>
              <p style="margin:0 0 24px 0;line-height:1.6;color:#d9d9d9;">
                Thank you for attending <strong>${escapeHtml(eventTitle)}</strong>. Your certificate of participation is attached and available below.
              </p>
              <p style="margin:0 0 24px 0;">
                <a href="${reg.cert_url}" style="display:inline-block;padding:14px 28px;background:#2D7FF9;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:600;">
                  Download certificate
                </a>
              </p>
              <p style="margin:0;font-size:13px;color:#9e9e9e;">
                This link expires in seven years. Save your certificate locally for safe keeping.
              </p>
            </td></tr>
          </table>
          <p style="font-size:12px;color:#6e6e6e;margin-top:24px;">Codemo Teams &middot; codemoteam.org</p>
        </td></tr>
      </table>
    </body></html>
  `

  try {
    await client.send({
      from,
      to: user.email,
      subject: `Your Certificate — ${eventTitle}`,
      content: 'auto',
      html,
    })
    await client.close()
  } catch (e) {
    console.error('send-cert-email: smtp send failed', e)
    return envelope(origin, 502, null, 'Failed to send email')
  }

  await audit(auth.serviceClient, auth.userId, 'cert.emailed', { event_id, user_id })
  return envelope(origin, 200, { sent: true }, null)
})

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}
