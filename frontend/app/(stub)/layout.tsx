import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { BotDock } from '@/components/layout/BotDock'
import { auth } from '@/lib/auth'

export default async function StubLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const isAuthenticated = !!session?.user
  const user = session?.user
    ? { firstName: (session.user.name ?? '').split(' ')[0], avatarUrl: session.user.image ?? null }
    : null

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-base overflow-hidden" style={{ padding: '12px', gap: '8px' }}>
      <Navbar isAuthenticated={isAuthenticated} user={user} />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main id="main-content" className="flex-1 min-w-0 bg-bg-base overflow-y-auto overflow-x-hidden ml-3 rounded-md" tabIndex={-1}>
          {children}
        </main>
      </div>
      <BotDock />
    </div>
  )
}
