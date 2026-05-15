import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { corsHeaders, envelope, requireAdmin, audit } from '../_shared/admin.ts'

const bodySchema = z.object({
  event_id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
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

  const { event_id, status } = parsed.data

  const { error } = await auth.serviceClient
    .from('events')
    .update({ status })
    .eq('id', event_id)

  if (error) {
    console.error('admin-publish-event: update failed', error)
    return envelope(origin, 500, null, 'Failed to update event status')
  }

  await audit(auth.serviceClient, auth.userId, 'admin.event_status_change', { event_id, status })

  return envelope(origin, 200, { event_id, status }, null)
})
