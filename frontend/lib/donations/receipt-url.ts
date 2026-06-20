import { createAdminClient } from '@/lib/supabase/admin'

export async function getDonationReceiptSignedUrl(
  receiptPath: string | null,
  expiresIn = 3600,
): Promise<string | null> {
  if (!receiptPath) return null
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('donation-receipts')
    .createSignedUrl(receiptPath, expiresIn)
  if (error) return null
  return data.signedUrl
}
