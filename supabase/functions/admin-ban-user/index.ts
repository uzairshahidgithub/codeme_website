import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { corsHeaders, envelope, requireAdmin, audit } from '../_shared/admin.ts'

const bodySchema = z.object({
  target_user_id: z.string().uuid(),
  banned: z.boolean(),
  reason: z.string().max(500).optional(),
})

serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') {
    return envelope(origin, 405, null, 'Method not allowed')
  }

  const auth = await requireAdmin(req, origin, 'admin')
  if (!auth.ok) return auth.response

  let body: unknown
  try { body = await req.json() } catch { return envelope(origin, 400, null, 'Invalid JSON') }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return envelope(origin, 422, null, 'Validation failed', { fields: parsed.error.flatten().fieldErrors })
  }

  const { target_user_id, banned, reason } = parsed.data
  if (target_user_id === auth.userId) {
    return envelope(origin, 400, null, 'Cannot ban yourself')
  }

  // Supabase Auth admin API uses ban_duration string ('24h', '8760h', 'none' to unban)
  const ban_duration = banned ? '8760h' : 'none'
  const { error } = await auth.serviceClient.auth.admin.updateUserById(target_user_id, { ban_duration })

  if (error) {
    console.error('admin-ban-user: update failed', error)
    return envelope(origin, 500, null, 'Failed to update ban status')
  }

  await audit(auth.serviceClient, auth.userId, banned ? 'admin.user_ban' : 'admin.user_unban', {
    target_user_id,
    reason: reason ?? null,
  })

  return envelope(origin, 200, { target_user_id, banned }, null)
})
