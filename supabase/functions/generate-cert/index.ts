import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'
import { corsHeaders, envelope, requireAdmin, audit } from '../_shared/admin.ts'

const bodySchema = z.object({
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
})

const SEVEN_YEARS_SECONDS = 7 * 365 * 24 * 60 * 60

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
  const { event_id, user_id } = parsed.data

  // Fetch event
  const { data: event, error: eventErr } = await auth.serviceClient
    .from('events')
    .select('id, title, starts_at, cert_template_url, cert_enabled')
    .eq('id', event_id)
    .single()
  if (eventErr || !event) return envelope(origin, 404, null, 'Event not found')
  if (!event.cert_enabled) return envelope(origin, 400, null, 'Certificates are not enabled for this event')
  if (!event.cert_template_url) return envelope(origin, 400, null, 'No certificate template uploaded')

  // Fetch attendee profile
  const { data: profile } = await auth.serviceClient
    .from('profiles')
    .select('first_name, last_name, display_name, username')
    .eq('id', user_id)
    .single()
  const attendeeName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.username ||
    'Attendee'

  // Confirm attendance
  const { data: reg } = await auth.serviceClient
    .from('event_registrations')
    .select('attended')
    .eq('event_id', event_id)
    .eq('user_id', user_id)
    .single()
  if (!reg?.attended) {
    return envelope(origin, 400, null, 'User has not been marked as attended')
  }

  // Download template (template is stored under cert-templates/<filename>)
  // cert_template_url is stored as a path inside the bucket, e.g. "cert-templates/abc.pdf"
  const templatePath = event.cert_template_url.replace(/^event-assets\//, '')
  const { data: templateBlob, error: dlErr } = await auth.serviceClient
    .storage
    .from('event-assets')
    .download(templatePath)
  if (dlErr || !templateBlob) return envelope(origin, 500, null, 'Failed to download cert template')

  const templateBytes = new Uint8Array(await templateBlob.arrayBuffer())

  // Build PDF — overlay {name} {event} {date}
  // For PNG/JPEG templates: embed as a single-page background.
  // For PDF templates: load the first page.
  let pdfDoc: PDFDocument
  const isPdf = templatePath.toLowerCase().endsWith('.pdf')
  if (isPdf) {
    pdfDoc = await PDFDocument.load(templateBytes)
  } else {
    pdfDoc = await PDFDocument.create()
    const isPng = templatePath.toLowerCase().endsWith('.png')
    const img = isPng
      ? await pdfDoc.embedPng(templateBytes)
      : await pdfDoc.embedJpg(templateBytes)
    const page = pdfDoc.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }

  const page = pdfDoc.getPages()[0]
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const subFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const dateStr = new Date(event.starts_at).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  // Centred placeholder layout — templates ideally include {name} {event} {date}
  // markers in their design but we render reliable defaults regardless.
  const drawCentred = (text: string, y: number, size: number, useBold = true) => {
    const f = useBold ? font : subFont
    const w = f.widthOfTextAtSize(text, size)
    page.drawText(text, {
      x: (width - w) / 2, y, size, font: f, color: rgb(0.10, 0.10, 0.10),
    })
  }
  drawCentred(attendeeName,    height * 0.55, 36, true)
  drawCentred(event.title,     height * 0.42, 22, false)
  drawCentred(dateStr,         height * 0.32, 16, false)

  const certBytes = await pdfDoc.save()
  const certPath = `generated-certs/${event_id}/${user_id}.pdf`

  const { error: upErr } = await auth.serviceClient
    .storage
    .from('event-assets')
    .upload(certPath, certBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })
  if (upErr) return envelope(origin, 500, null, `Failed to upload cert: ${upErr.message}`)

  const { data: signed, error: signErr } = await auth.serviceClient
    .storage
    .from('event-assets')
    .createSignedUrl(certPath, SEVEN_YEARS_SECONDS)
  if (signErr || !signed) return envelope(origin, 500, null, 'Failed to sign cert URL')

  const { error: updErr } = await auth.serviceClient
    .from('event_registrations')
    .update({ cert_url: signed.signedUrl, cert_issued: true })
    .eq('event_id', event_id)
    .eq('user_id', user_id)
  if (updErr) return envelope(origin, 500, null, 'Failed to record cert issuance')

  await audit(auth.serviceClient, auth.userId, 'cert.generated', { event_id, user_id })

  return envelope(origin, 200, { cert_url: signed.signedUrl }, null)
})
