import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { Feedback, type FeedbackItem } from './Feedback'
import { SoftReveal } from './SoftReveal'

const fetchFeedback = unstable_cache(
  async (): Promise<FeedbackItem[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, name, role, content, rating, avatar_url')
      .eq('approved', true)
      .order('order_index', { ascending: true })
      .limit(8)
    if (error) {
      console.warn('testimonials fetch failed:', error.message)
      return []
    }
    return (data ?? []) as FeedbackItem[]
  },
  ['home:testimonials'],
  { revalidate: 600, tags: ['testimonials'] },
)

const FALLBACK: FeedbackItem[] = [
  { id: 'f1', name: 'Léa Dubois',    role: 'Junior SWE · Lyon',          rating: 5, content: 'The Discord gave me a place to ask the questions I was too embarrassed to ask at work. Six months later I shipped my first prod feature.' },
  { id: 'f2', name: 'Tomás Herrera', role: 'Bootcamp grad · Madrid',     rating: 5, content: 'Career clinic mocks got my offer up by 22%. The reviewers were brutal in the best way.' },
  { id: 'f3', name: 'Ifeoma Okafor', role: 'Security analyst · Lagos',   rating: 5, content: 'I came for the AI track and stayed for the cybersec community.' },
  { id: 'f4', name: 'Mei Tanaka',    role: 'ML engineer · Osaka',        rating: 5, content: 'Office hours pulled me out of two dead ends in the same week. Real engineers, no fluff.' },
  { id: 'f5', name: 'Kavi Sharma',   role: 'Founding eng · Bangalore',   rating: 5, content: 'I walked in not knowing how to push a branch. A year later I am leading our infra team.' },
  { id: 'f6', name: 'Adaeze Nwosu',  role: 'Designer-turned-dev · Abuja',rating: 5, content: 'No one made me feel slow for asking. That alone changed everything about how I learn.' },
  { id: 'f7', name: 'Mahdi Karimi',  role: 'Platform eng · Tehran',      rating: 5, content: 'Office hours and the threat-modelling track saved me three sprints of dead ends.' },
  { id: 'f8', name: 'Sofía Méndez',  role: 'Distributed systems · CDMX', rating: 5, content: 'I shipped my first OSS PR off a Saturday hack. The reviewers were kind and merciless.' },
]

export async function Testimonials() {
  const fetched = await fetchFeedback()
  const items = fetched.length > 0 ? fetched : FALLBACK

  return (
    <section data-screen-label="07 Testimonials" className="py-10 md:py-24">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8">
        <SoftReveal as="header" className="mb-8 md:mb-14">
          <h2 className="font-sans font-semibold tracking-normal text-text-primary leading-snug max-w-[22ch] text-2xl md:text-4xl lg:text-5xl">
            What our people say when no one&apos;s listening.
          </h2>
        </SoftReveal>
      </div>

      <Feedback items={items} />
    </section>
  )
}
