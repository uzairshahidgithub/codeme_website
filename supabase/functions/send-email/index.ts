import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { sendEmail } from '../_shared/mailjet.ts'

const ALLOWED_ORIGINS = [
  'https://codemoteam.org',
  'http://localhost:3000',
  'http://localhost:3001',
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const emailFrom = Deno.env.get('EMAIL_FROM') ?? Deno.env.get('MAILJET_FROM_EMAIL') ?? 'noreply@codemoteam.org'

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('send-email: missing Supabase environment variables')
    return envelope(origin, 500, null, 'Server misconfigured')
  }

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

  try {
    const result = await sendEmail({ to, subject, html, text, fromEmail: emailFrom })
    supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'email.sent',
      metadata: { to, subject, transport: result.transport, messageId: result.messageId },
    }).then(({ error: auditErr }) => {
      if (auditErr) console.warn('send-email: audit log insert failed', auditErr)
    })
    return envelope(origin, 200, { sent: true, messageId: result.messageId }, null)
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown'
    console.error(`send-email: send failed — ${detail}`)
    return envelope(origin, 502, null, 'Failed to send email')
  }
})
