import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
  confirmation: z.literal('DELETE_MY_ACCOUNT'),
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

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ data: null, error: 'Invalid JSON', meta: {} }), { status: 400, headers })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ data: null, error: 'Confirmation phrase incorrect', meta: { required: 'DELETE_MY_ACCOUNT' } }),
      { status: 422, headers },
    )
  }

  // Audit log first (before user_id is set null by cascade)
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: 'account.delete',
    metadata: { email: user.email, deleted_at: new Date().toISOString() },
  })

  // Delete avatar files in storage
  const { data: avatarFiles } = await supabase.storage
    .from('user-avatars')
    .list(user.id)
  if (avatarFiles && avatarFiles.length > 0) {
    const paths = avatarFiles.map((f) => `${user.id}/${f.name}`)
    await supabase.storage.from('user-avatars').remove(paths)
  }

  // Delete the auth user — cascades to profiles via FK constraint
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('Failed to delete user:', deleteError)
    return new Response(
      JSON.stringify({ data: null, error: 'Failed to delete account', meta: {} }),
      { status: 500, headers },
    )
  }

  return new Response(
    JSON.stringify({ data: { deleted: true }, error: null, meta: {} }),
    { status: 200, headers },
  )
})
