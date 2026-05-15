import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const ALLOWED_ORIGINS = [
  'https://codemoteam.org',
  'http://localhost:3000',
]

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

const bodySchema = z.object({
  token: z.string().min(1, 'Turnstile token is required'),
})

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''
  const headers = { ...corsHeaders(origin), 'content-type': 'application/json' }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ data: null, error: 'Invalid JSON', meta: {} }), { status: 400, headers })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ data: null, error: 'Validation failed', meta: { fields: parsed.error.flatten().fieldErrors } }),
      { status: 422, headers },
    )
  }

  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY not set')
    return new Response(JSON.stringify({ data: null, error: 'Server misconfigured', meta: {} }), { status: 500, headers })
  }

  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? ''

  const form = new FormData()
  form.append('secret', secret)
  form.append('response', parsed.data.token)
  if (ip) form.append('remoteip', ip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })

  const result = await res.json() as TurnstileResponse

  if (!result.success) {
    return new Response(
      JSON.stringify({
        data: { verified: false },
        error: 'Verification failed',
        meta: { codes: result['error-codes'] ?? [] },
      }),
      { status: 200, headers },
    )
  }

  return new Response(
    JSON.stringify({
      data: { verified: true, hostname: result.hostname, challengeTs: result.challenge_ts },
      error: null,
      meta: {},
    }),
    { status: 200, headers },
  )
})
