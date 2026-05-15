import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { corsHeaders, envelope, requireAdmin, audit } from '../_shared/admin.ts'

const bodySchema = z.object({
  target_user_id: z.string().uuid(),
  new_role: z.enum(['member', 'moderator', 'admin', 'super_admin']),
})

serve(async (req) => {
  const origin = req.headers.get('origin') ?? ''

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') {
    return envelope(origin, 405, null, 'Method not allowed')
  }

  // Only super_admin may change roles
  const auth = await requireAdmin(req, origin, 'super_admin')
  if (!auth.ok) return auth.response

  let body: unknown
  try { body = await req.json() } catch { return envelope(origin, 400, null, 'Invalid JSON') }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return envelope(origin, 422, null, 'Validation failed', { fields: parsed.error.flatten().fieldErrors })
  }

  const { target_user_id, new_role } = parsed.data
  if (target_user_id === auth.userId) {
    return envelope(origin, 400, null, 'Cannot change your own role')
  }

  const { error } = await auth.serviceClient
    .from('profiles')
    .update({ role: new_role })
    .eq('id', target_user_id)

  if (error) {
    console.error('admin-promote-user: update failed', error)
    return envelope(origin, 500, null, 'Failed to update role')
  }

  await audit(auth.serviceClient, auth.userId, 'admin.role_change', {
    target_user_id,
    new_role,
    actor_role: auth.role,
  })

  return envelope(origin, 200, { target_user_id, new_role }, null)
})
