import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileCard } from '@/components/profile/ProfileCard'

export const metadata = { title: 'Profile | Codemo Teams' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const meta = user.user_metadata as {
    first_name?: string
    username?: string
    avatar_url?: string
    domain?: string
    status?: string
    gender?: string
    dob?: string
  }

  const profileUser = {
    firstName: meta.first_name ?? meta.username ?? user.email?.split('@')[0] ?? 'User',
    username: meta.username ?? '',
    avatarUrl: meta.avatar_url ?? null,
    email: user.email ?? '',
    domain: meta.domain ?? null,
    status: meta.status ?? null,
    gender: meta.gender ?? null,
    dob: meta.dob ?? null,
  }

  return <ProfileCard user={profileUser} />
}
