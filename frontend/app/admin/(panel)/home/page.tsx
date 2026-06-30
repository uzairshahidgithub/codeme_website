import { listHomeAdminData } from '@/lib/home/public'
import { HomeCustomizer } from '@/components/admin/HomeCustomizer'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const data = await listHomeAdminData()

  return (
    <div className="px-6 md:px-10 py-8 max-w-[900px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · home</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Home customization</h1>
        <p className="text-text-tertiary mt-1 text-sm">
          Pick homepage courses and events, manage donation accounts, feedback, and the reach-out image.
        </p>
      </header>
      <HomeCustomizer
        courses={data.courses as { id: string; title: string }[]}
        events={data.events as { id: string; title: string }[]}
        accounts={data.accounts as { id: string; label: string; account_value: string; account_name: string; sort_order: number }[]}
        featuredCourseIds={data.featuredCourseIds}
        featuredEventIds={data.featuredEventIds}
        portraitUrl={data.portraitUrl}
        testimonials={data.testimonials as { id: string; name: string; role: string | null; content: string; approved: boolean; rating: number }[]}
      />
    </div>
  )
}
