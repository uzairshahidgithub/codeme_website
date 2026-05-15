// Shared helpers for admin Edge Functions.
// Verifies the caller's JWT, checks role claim, returns a service-role client
// for the action and a structured envelope helper.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const ALLOWED_ORIGINS = [
  'https://codemoteam.org',
  'http://localhost:3000',
] as const

export type AdminRole = 'admin' | 'super_admin'

export const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin as typeof ALLOWED_ORIGINS[number]) ? origin : '',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
})

export function envelope(
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

interface AuthResult {
  ok: true
  userId: string
  email: string
  role: AdminRole
  serviceClient: SupabaseClient
}
interface AuthFail {
  ok: false
  response: Response
}

/**
 * Validates that the caller is an admin (or super_admin).
 * Returns either an authorised context or a ready-to-return Response.
 */
export async function requireAdmin(
  req: Request,
  origin: string,
  required: AdminRole = 'admin',
): Promise<AuthResult | AuthFail> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, response: envelope(origin, 500, null, 'Server misconfigured') }
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, response: envelope(origin, 401, null, 'Unauthorised') }
  }

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const token = authHeader.slice(7)
  const { data: { user }, error } = await serviceClient.auth.getUser(token)
  if (error || !user) {
    return { ok: false, response: envelope(origin, 401, null, 'Unauthorised') }
  }

  // Decode the JWT payload (no signature check — already validated by getUser above)
  let role: string | null = null
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? ''))
    role = payload?.role ?? null
  } catch {
    role = null
  }

  if (!role || (role !== 'admin' && role !== 'super_admin')) {
    return { ok: false, response: envelope(origin, 403, null, 'Forbidden — admin role required') }
  }
  if (required === 'super_admin' && role !== 'super_admin') {
    return { ok: false, response: envelope(origin, 403, null, 'Forbidden — super_admin role required') }
  }

  return { ok: true, userId: user.id, email: user.email ?? '', role: role as AdminRole, serviceClient }
}

export async function audit(
  client: SupabaseClient,
  actor: string,
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const { error } = await client.from('audit_log').insert({
    user_id: actor,
    action,
    metadata,
  })
  if (error) console.warn(`audit insert failed for ${action}:`, error.message)
}
