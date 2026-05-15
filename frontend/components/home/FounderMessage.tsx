import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

interface FounderContent {
  name: string
  role: string
  photo_url: string | null
  paragraphs: string[]
}

const FALLBACK: FounderContent = {
  name: 'Riccardo Conte',
  role: 'Founder, Codemo Teams',
  photo_url: null,
  paragraphs: [
    'We started Codemo because three communities — Code Motion, Code Motivation and Code Movement — kept solving the same problem in three slightly different rooms. So we tore down the walls.',
    'The mission is simple. Talent has no limits, and money should never be the gatekeeper to a career in technology. If you can show up and do the work, we will meet you halfway with the channels, the tutorials and the people who have already walked the path.',
    'This page is just the doorway. The community lives behind it.',
  ],
}

const fetchFounder = unstable_cache(
  async (): Promise<FounderContent> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'founder_message')
      .single()
    if (error || !data?.value) return FALLBACK
    const v = data.value as Partial<FounderContent>
    return {
      name: v.name ?? FALLBACK.name,
      role: v.role ?? FALLBACK.role,
      photo_url: v.photo_url ?? null,
      paragraphs: Array.isArray(v.paragraphs) && v.paragraphs.length > 0 ? v.paragraphs : FALLBACK.paragraphs,
    }
  },
  ['home:founder'],
  { revalidate: 3600, tags: ['site_content'] },
)

function QuoteMark() {
  return (
    <svg className="founder-quote-mark" viewBox="0 0 100 80" width="120" height="96" fill="currentColor" aria-hidden="true">
      <path d="M0 50c0-22 14-40 36-46v12c-12 6-20 18-20 30h20v34H0V50zm56 0c0-22 14-40 36-46v12c-12 6-20 18-20 30h20v34H56V50z"/>
    </svg>
  )
}

export async function FounderMessage() {
  const f = await fetchFounder()

  return (
    <section className="founder" data-screen-label="06 Founder">
      <div className="founder-inner">
        <aside className="founder-side">
          <div className="founder-photo">
            {f.photo_url ? (
              <Image src={f.photo_url} alt={`${f.name} portrait`} fill sizes="240px" className="object-cover" />
            ) : (
              <>
                <div className="banner-stripes" />
                <span className="banner-tag">founder photo</span>
              </>
            )}
          </div>
          <div className="founder-name">{f.name}</div>
          <div className="founder-role">{f.role}</div>
        </aside>
        <div className="founder-body">
          <QuoteMark />
          {f.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </section>
  )
}
