import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { corsHeaders, envelope, requireAdmin, audit } from '../_shared/admin.ts'

const bodySchema = z.object({
  testimonial_id: z.string().uuid(),
  approved: z.boolean(),
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

  const { testimonial_id, approved } = parsed.data

  const { error } = await auth.serviceClient
    .from('testimonials')
    .update({ approved })
    .eq('id', testimonial_id)

  if (error) {
    console.error('admin-approve-testimonial: update failed', error)
    return envelope(origin, 500, null, 'Failed to update testimonial')
  }

  await audit(auth.serviceClient, auth.userId, approved ? 'admin.testimonial_approve' : 'admin.testimonial_reject', {
    testimonial_id,
  })

  return envelope(origin, 200, { testimonial_id, approved }, null)
})
