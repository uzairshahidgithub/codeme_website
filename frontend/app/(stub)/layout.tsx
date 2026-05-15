import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BotDock } from '@/components/layout/BotDock'
import { createClient } from '@/lib/supabase/server'

export default async function StubLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  // getUser() throws on stale refresh tokens. Treat any throw as "signed out".
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }

  const isAuthenticated = !!user
  const profileData = user?.user_metadata as
    | { username?: string; first_name?: string; avatar_url?: string }
    | undefined

  const appUser = user
    ? {
        firstName:
          profileData?.first_name ??
          profileData?.username ??
          user.email?.split('@')[0] ??
          'User',
        avatarUrl: profileData?.avatar_url ?? null,
      }
    : null

  return (
    <div
      className="flex flex-col h-screen w-screen bg-bg-base overflow-hidden"
      style={{ padding: '12px', gap: '8px' }}
    >
      <Navbar isAuthenticated={isAuthenticated} user={appUser} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main
          id="main-content"
          className="flex-1 min-w-0 bg-bg-base overflow-y-auto overflow-x-hidden ml-3 rounded-md"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
      <BotDock />
    </div>
  )
}
