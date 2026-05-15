import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const ALLOWED_ORIGINS = [
  'https://codemoteam.org',
  'http://localhost:3000',
]

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
})

const bodySchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  html: z.string().min(1).max(200_000),
  text: z.string().max(200_000).optional(),
})

function envelope(
  origin: string,
  status: number,
  data: unknown,
  error: string | null,
  meta: Record<string, unknown> = {},
) {
  return new Response(JSON.stringify({ data, error, meta }), {
    status,
    headers: { ...corsHeaders(origin), 'content-type': 'application/json' },
  })
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return envelope(origin, 405, null, 'Method not allowed')
  }

  // Required secrets — fail fast if not set
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const smtpHost = Deno.env.get('SMTP_HOST')
  const smtpPortRaw = Deno.env.get('SMTP_PORT') ?? '587'
  const smtpUser = Deno.env.get('SMTP_USER')
  const smtpPass = Deno.env.get('SMTP_PASS')
  const emailFrom = Deno.env.get('EMAIL_FROM') ?? 'noreply@codemoteam.org'

  if (!supabaseUrl || !serviceRoleKey || !smtpHost || !smtpUser || !smtpPass) {
    console.error('send-email: missing required environment variables')
    return envelope(origin, 500, null, 'Server misconfigured')
  }

  const smtpPort = Number.parseInt(smtpPortRaw, 10)
  if (!Number.isInteger(smtpPort) || smtpPort <= 0 || smtpPort > 65_535) {
    console.error(`send-email: invalid SMTP_PORT ${smtpPortRaw}`)
    return envelope(origin, 500, null, 'Server misconfigured')
  }

  // Verify caller JWT
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return envelope(origin, 401, null, 'Unauthorised')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7))
  if (authError || !user) {
    return envelope(origin, 401, null, 'Unauthorised')
  }

  // Parse + validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return envelope(origin, 400, null, 'Invalid JSON')
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return envelope(origin, 422, null, 'Validation failed', { fields: parsed.error.flatten().fieldErrors })
  }

  const { to, subject, html, text } = parsed.data

  // Send via Postal SMTP relay.
  // Port 587 → STARTTLS upgrade, port 465 → implicit TLS.
  const useImplicitTls = smtpPort === 465
  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: useImplicitTls,
      auth: { username: smtpUser, password: smtpPass },
    },
  })

  try {
    await client.send({
      from: emailFrom,
      to,
      subject,
      content: text ?? 'This email requires an HTML-capable mail client.',
      html,
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown'
    console.error(`send-email: SMTP send failed — ${detail}`)
    try { await client.close() } catch { /* noop */ }
    return envelope(origin, 502, null, 'Failed to send email')
  }

  try { await client.close() } catch { /* noop */ }

  // Audit log — non-blocking
  supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'email.sent',
    metadata: { to, subject, transport: 'postal-smtp' },
  }).then(({ error: auditErr }) => {
    if (auditErr) console.warn('send-email: audit log insert failed', auditErr)
  })

  return envelope(origin, 200, { sent: true }, null)
})
