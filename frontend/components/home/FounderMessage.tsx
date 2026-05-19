import Image from 'next/image'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { ScrollMaskReveal } from './ScrollMaskReveal'

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
      paragraphs:
        Array.isArray(v.paragraphs) && v.paragraphs.length > 0
          ? v.paragraphs
          : FALLBACK.paragraphs,
    }
  },
  ['home:founder'],
  { revalidate: 3600, tags: ['site_content'] },
)

export async function FounderMessage() {
  const f = await fetchFounder()
  const initials = f.name
    .split(' ')
    .map((s) => s[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const [first, ...rest] = f.paragraphs

  return (
    <section data-screen-label="06 Founder" className="px-4 md:px-8 py-10 md:py-24">
      <div className="max-w-[1100px] mx-auto">
        <article className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-start">
          {/* Circular avatar with thin stroke ring */}
          <aside className="md:col-span-3 flex md:block">
            <div
              className="
                relative w-[140px] h-[140px] md:w-[168px] md:h-[168px]
                rounded-full overflow-hidden
                ring-[1.5px] ring-border-subtle
                shadow-[0_24px_60px_-30px_color-mix(in_oklab,var(--blue)_55%,transparent)]
              "
              style={{ background: 'color-mix(in oklab, var(--text1) 4%, transparent)' }}
            >
              <span
                aria-hidden="true"
                className="absolute -inset-4 rounded-full -z-10 blur-2xl opacity-70"
                style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--blue) 26%, transparent), transparent 70%)' }}
              />
              {f.photo_url ? (
                <Image
                  src={f.photo_url}
                  alt={`${f.name} portrait`}
                  fill
                  sizes="168px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center font-sans font-medium tracking-[-0.04em] text-text-secondary text-[56px]">
                  {initials}
                </div>
              )}
            </div>
          </aside>

          {/* Editorial copy with scroll-velocity mask reveal */}
          <div className="md:col-span-9 flex flex-col gap-6">
            {first && (
              <ScrollMaskReveal
                text={first}
                className="font-sans font-light tracking-[-0.02em] text-text-primary leading-snug"
                style={{ fontSize: 'clamp(19px, 3vw, 32px)' }}
              />
            )}

            <div className="space-y-4 max-w-prose">
              {rest.map((p, i) => (
                <ScrollMaskReveal
                  key={i}
                  text={p}
                  className="text-[15px] md:text-[16px] leading-[1.7] text-text-secondary font-light"
                />
              ))}
            </div>

            <footer className="pt-6 border-t border-border-subtle/70">
              <div className="text-sm font-medium text-text-primary">{f.name}</div>
              <div className="text-xs text-text-tertiary mt-1">{f.role}</div>
            </footer>
          </div>
        </article>
      </div>
    </section>
  )
}
