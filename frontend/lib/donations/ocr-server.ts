import type { OcrExtractResult, PaymentMethod } from '@/lib/schemas/donations'

const OCR_URL = process.env.DONATION_OCR_URL?.replace(/\/$/, '')
const OCR_KEY = process.env.DONATION_OCR_API_KEY

export function isDonationOcrConfigured(): boolean {
  return Boolean(OCR_URL)
}

export async function extractReceiptText(file: File): Promise<OcrExtractResult> {
  if (!OCR_URL) {
    throw new Error(
      'Donation OCR is not configured. Set DONATION_OCR_URL (e.g. http://localhost:8001) on the server.',
    )
  }

  const form = new FormData()
  form.append('file', file, file.name)

  const headers: Record<string, string> = {}
  if (OCR_KEY) headers['x-api-key'] = OCR_KEY

  const res = await fetch(`${OCR_URL}/ocr`, {
    method: 'POST',
    headers,
    body: form,
  })

  const payload = (await res.json().catch(() => null)) as {
    detail?: string
    text?: string
    transaction_id?: string | null
    extracted_amount?: number | null
    payment_method?: string | null
  } | null

  if (!res.ok) {
    const msg = payload?.detail ?? `OCR service error (${res.status})`
    throw new Error(msg)
  }

  const method = payload?.payment_method
  const payment_method: PaymentMethod =
    method === 'jazzcash' || method === 'easypaisa' || method === 'bank' || method === 'other'
      ? method
      : null

  return {
    text: payload?.text?.trim() || '',
    transaction_id: payload?.transaction_id ?? null,
    extracted_amount:
      typeof payload?.extracted_amount === 'number' ? payload.extracted_amount : null,
    payment_method,
  }
}
