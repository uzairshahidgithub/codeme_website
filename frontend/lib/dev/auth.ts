import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessDevTools } from '@/lib/roles'
import { getProfileForUser } from '@/lib/admin/auth'

export async function requireDevPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth?redirect=/dev')
  }

  const profile = await getProfileForUser(user.id)
  if (!profile || !canAccessDevTools(profile.role)) {
    redirect('/')
  }

  return { user, profile }
}
