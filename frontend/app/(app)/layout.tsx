import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { CookiesBanner } from '@/components/layout/CookiesBanner'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        avatarUrl: profileData?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      }
    : null

  return (
    <div className="h-screen w-screen bg-bg-base flex flex-col">
      <Navbar isAuthenticated={isAuthenticated} user={appUser} />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Bottom Nav */}
      <div className="block lg:hidden">
        <BottomNav />
      </div>

      <main
        id="main-content"
        className="flex-1 bg-bg-base overflow-y-auto overflow-x-hidden pt-[90px] lg:pt-[100px] lg:pl-[100px] px-2 lg:px-8 pb-[100px] lg:pb-0"
        tabIndex={-1}
      >
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </main>

      <CookiesBanner />
    </div>
  )
}
