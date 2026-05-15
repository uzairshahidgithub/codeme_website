import type { Metadata } from 'next'
import { Suspense } from 'react'
import '@/app/home-aesthetic.css'
import { Hero } from '@/components/home/Hero'
import { HomeStats } from '@/components/home/HomeStats'
import { EventsHighlights, EventsSkeleton } from '@/components/home/EventsHighlights'
import { CourseHighlights, CourseSkeletonStrip } from '@/components/home/CourseHighlights'
import { Testimonials } from '@/components/home/Testimonials'
import { FounderMessage } from '@/components/home/FounderMessage'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Codemo Teams — Community of Future Tech Leaders',
  description:
    'Join a community of developers solving real problems together. Events, eLearn courses, projects and career support for builders worldwide.',
  openGraph: {
    title: 'Codemo Teams — Community of Future Tech Leaders',
    description:
      'Join a community of developers solving real problems together. Events, eLearn courses, projects and career support for builders worldwide.',
    type: 'website',
    url: 'https://codemoteam.org',
    siteName: 'Codemo Teams',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codemo Teams — Community of Future Tech Leaders',
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
    'https://github.com/uzairshahidgithub/Codemo-Website',
    'https://www.linkedin.com/company/codemo-teams',
  ],
}

export default function HomePage() {
  return (
    <div className="home-aesthetic flex flex-col w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
      />

      <Hero />
      <HomeStats />

      <Suspense fallback={<EventsSkeleton />}>
        <EventsHighlights />
      </Suspense>

      <Suspense fallback={<CourseSkeletonStrip />}>
        <CourseHighlights />
      </Suspense>

      <Suspense fallback={null}>
        <Testimonials />
      </Suspense>

      <Suspense fallback={null}>
        <FounderMessage />
      </Suspense>

      <Footer />
    </div>
  )
}
