import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'
import { TestimonialsStack, type TestimonialItem } from './TestimonialsStack'

const fetchTestimonials = unstable_cache(
  async (): Promise<TestimonialItem[]> => {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, name, role, content, rating, avatar_url')
      .eq('approved', true)
      .order('order_index', { ascending: true })
      .limit(6)
    if (error) {
      console.warn('testimonials fetch failed:', error.message)
      return []
    }
    return (data ?? []) as TestimonialItem[]
  },
  ['home:testimonials'],
  { revalidate: 600, tags: ['testimonials'] },
)

const FALLBACK: TestimonialItem[] = [
  { id: 'f1', name: 'Léa Dubois',    role: 'Junior SWE · Lyon',         rating: 5, content: 'The Discord channels gave me a place to ask the questions I was too embarrassed to ask at work. Six months later I shipped my first prod feature.' },
  { id: 'f2', name: 'Tomás Herrera', role: 'Bootcamp grad · Madrid',    rating: 5, content: 'Career clinic mocks got my offer up by 22%. The reviewers were brutal in the best way.' },
  { id: 'f3', name: 'Ifeoma Okafor', role: 'Security analyst · Lagos',  rating: 5, content: 'I came for the AI track and stayed for the cybersec community. The threat modelling workshop alone was worth a year of subs.' },
  { id: 'f4', name: 'Mei Tanaka',    role: 'ML engineer · Osaka',       rating: 5, content: 'Office hours pulled me out of two dead ends in the same week. Real engineers, no fluff, no upsell.' },
]

export async function Testimonials() {
  const fetched = await fetchTestimonials()
  const items = fetched.length > 0 ? fetched : FALLBACK

  return (
    <section className="testi" data-screen-label="05 Testimonials">
      <header className="sec-head sec-head-center">
        <h2>What our community says</h2>
      </header>
      <TestimonialsStack items={items} />
    </section>
  )
}
