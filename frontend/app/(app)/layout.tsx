import { auth } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { CookiesBanner } from '@/components/layout/CookiesBanner'

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const isAuthenticated = !!session?.user

  const user = session?.user
    ? {
        firstName: (session.user.name ?? '').split(' ')[0],
        avatarUrl: session.user.image ?? null,
      }
    : null

  return (
    <div className="min-h-screen w-screen bg-bg-base flex flex-col">
      <Navbar isAuthenticated={isAuthenticated} user={user} />
      
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
        {children}
      </main>

      <CookiesBanner />
    </div>
  )
}
