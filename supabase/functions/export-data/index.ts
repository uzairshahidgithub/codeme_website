import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://codemoteam.org',
  'http://localhost:3000',
]

const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
})

serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''
  const headers = { ...corsHeaders(origin), 'content-type': 'application/json' }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ data: null, error: 'Unauthorised', meta: {} }), { status: 401, headers })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ data: null, error: 'Unauthorised', meta: {} }), { status: 401, headers })
  }

  // Aggregate all user-owned data
  const [{ data: profile }, { data: auditEntries }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('audit_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000),
  ])

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
    },
    profile: profile ?? null,
    audit_log: auditEntries ?? [],
  }

  const json = JSON.stringify(exportPayload, null, 2)
  const filename = `${user.id}/export-${Date.now()}.json`

  // Upload to a temporary storage location (user-avatars bucket reused for short-lived signed exports)
  // Production should use a dedicated 'exports' bucket with TTL — left as a follow-up.
  const { error: uploadError } = await supabase.storage
    .from('user-avatars')
    .upload(filename, new Blob([json], { type: 'application/json' }), {
      contentType: 'application/json',
      upsert: true,
    })

  if (uploadError) {
    console.error('Upload failed:', uploadError)
    return new Response(
      JSON.stringify({ data: null, error: 'Failed to generate export', meta: {} }),
      { status: 500, headers },
    )
  }

  const { data: signed, error: signError } = await supabase.storage
    .from('user-avatars')
    .createSignedUrl(filename, 60 * 5) // 5-minute signed URL

  if (signError || !signed) {
    return new Response(
      JSON.stringify({ data: null, error: 'Failed to create download URL', meta: {} }),
      { status: 500, headers },
    )
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'account.export',
    metadata: { filename },
  })

  return new Response(
    JSON.stringify({
      data: { url: signed.signedUrl, expires_in_seconds: 300 },
      error: null,
      meta: {},
    }),
    { status: 200, headers },
  )
})
