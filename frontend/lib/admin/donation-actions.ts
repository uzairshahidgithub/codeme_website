'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/admin/roles'
import { getProfileForUser } from '@/lib/admin/auth'
import { UpdateDonationSchema, type UpdateDonationInput } from '@/lib/schemas/donations'

async function assertAdminSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('You must be signed in to perform this action.')
  }

  const profile = await getProfileForUser(user.id)
  if (!profile || !isAdminRole(profile.role)) {
    throw new Error('Forbidden: admin role required.')
  }

  return user
}

function adminDb() {
  return createAdminClient()
}

export async function updateDonationAction(payload: UpdateDonationInput): Promise<{ id: string }> {
  await assertAdminSession()
  const parsed = UpdateDonationSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    throw new Error(msg ?? 'Invalid donation data')
  }

  const { id, ...fields } = parsed.data
  const { error } = await adminDb()
    .from('donation_intents')
    .update({
      amount: fields.amount,
      currency: fields.currency,
      transaction_id: fields.transaction_id ?? null,
      extracted_amount: fields.extracted_amount ?? null,
      payment_method: fields.payment_method ?? null,
      status: fields.status,
      admin_notes: fields.admin_notes ?? null,
      ocr_text: fields.ocr_text ?? null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/donations')
  revalidatePath(`/admin/donations/${id}/edit`)
  return { id }
}

export async function deleteDonationAction(id: string): Promise<void> {
  await assertAdminSession()
  const { error } = await adminDb().from('donation_intents').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/donations')
}
