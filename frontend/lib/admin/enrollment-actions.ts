'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/admin/roles'
import { getProfileForUser } from '@/lib/admin/auth'
import { UpdateEnrollmentSchema } from '@/lib/schemas/enrollments'

async function assertAdminSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('You must be signed in.')
  const profile = await getProfileForUser(user.id)
  if (!profile || !isAdminRole(profile.role)) throw new Error('Forbidden.')
  return user
}

export async function updateEnrollmentStatusAction(
  id: string,
  status: 'pending' | 'verified' | 'cleared',
): Promise<void> {
  await assertAdminSession()
  const parsed = UpdateEnrollmentSchema.safeParse({ id, status })
  if (!parsed.success) throw new Error('Invalid status')

  const { error } = await createAdminClient()
    .from('course_enrollments')
    .update({
      status: parsed.data.status,
      cleared_at: parsed.data.status === 'cleared' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/enrollments')
}

export async function deleteEnrollmentAction(id: string): Promise<void> {
  await assertAdminSession()
  const { error } = await createAdminClient().from('course_enrollments').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/enrollments')
}
