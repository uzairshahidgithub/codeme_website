import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Hero } from '@/components/home/Hero'
import { EventsHighlights, EventsSkeleton } from '@/components/home/EventsHighlights'
import { CourseHighlights, CourseSkeletonStrip } from '@/components/home/CourseHighlights'
import { Testimonials } from '@/components/home/Testimonials'
import { FounderMessage } from '@/components/home/FounderMessage'
import { DonateSection } from '@/components/home/DonateSection'
import { ContactSection } from '@/components/home/ContactSection'
import { ScrollAmbient } from '@/components/home/ScrollAmbient'
import { CustomCursor } from '@/components/home/CustomCursor'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Codemo Teams',
  description:
    'A workshop, a Discord, a syllabus and a network — wired together so curious learners become shipping engineers.',
  openGraph: {
    title: 'Codemo Teams',
    description:
      'Join a community of developers solving real problems together. Events, eLearn courses, projects and career support for builders worldwide.',
    type: 'website',
    url: 'https://codemoteam.org',
    siteName: 'Codemo Teams',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codemo Teams',
    description: 'Community of developers building together.',
  },
}

const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Codemo Teams',
  url: 'https://codemoteam.org',
  description: 'A community of future tech leaders building solutions together.',
  sameAs: [
    'https://www.linkedin.com/company/codemo-teams',
    'https://www.youtube.com/@codemoteams',
    'https://www.instagram.com/codemoteams',
  ],
}

export default function HomePage() {
  return (
    /* NO overflow-hidden on this wrapper.
       Per CSS spec, any ancestor with overflow:hidden becomes
       the "scrolling ancestor" for descendant sticky elements
       — but a hidden ancestor never scrolls, so any nested
       sticky (e.g. CourseDeck) silently fails to pin. The
       rounded-corner clip lives on the Hero section itself
       instead (Hero already has its own overflow-hidden). */
    <div className="relative flex flex-col w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
      />

      {/* Page-wide scroll-linked ambient backdrop */}
      <ScrollAmbient />
      {/* Simple O'Reilly-style cursor — fine pointers only */}
      <CustomCursor />

      <Hero />

      {/* Courses repositioned above Events */}
      <Suspense fallback={<CourseSkeletonStrip />}>
        <CourseHighlights />
      </Suspense>

      <Suspense fallback={<EventsSkeleton />}>
        <EventsHighlights />
      </Suspense>

      <Suspense fallback={null}>
        <FounderMessage />
      </Suspense>

      <Suspense fallback={null}>
        <Testimonials />
      </Suspense>

      <DonateSection />
      <ContactSection />

      <Footer />
    </div>
  )
}
