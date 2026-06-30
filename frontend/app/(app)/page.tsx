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
import { fetchContactPortraitUrl, fetchDonationAccounts } from '@/lib/home/public'

export const metadata: Metadata = {
  title: 'Codemo Teams',
  description:
    'A workshop, a Discord, a syllabus and a network — wired together so curious learners become shipping engineers.',
  openGraph: {
    title: 'Codemo Teams',
    description:
      'Join a community of developers solving real problems together. Events, eLearn courses, projects and career support for builders worldwide.',
    type: 'website',
    url: 'https://codemoteams.org',
    siteName: 'Codemo Teams',
    images: [{ url: 'https://codemoteams.org/icons/codemo-logo-light.svg', width: 1200, height: 630, alt: 'Codemo Teams' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codemo Teams',
    description: 'Community of developers building together.',
    images: ['https://codemoteams.org/icons/codemo-logo-light.svg'],
  },
}

const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Codemo Teams',
  url: 'https://codemoteams.org',
  description: 'A community of future tech leaders building solutions together.',
  sameAs: [
    'https://www.linkedin.com/company/codemo-teams',
    'https://www.youtube.com/@codemoteams',
    'https://www.instagram.com/codemoteams',
  ],
}

export default async function HomePage() {
  const [accountsRaw, portraitUrl] = await Promise.all([
    fetchDonationAccounts(),
    fetchContactPortraitUrl(),
  ])

  const accounts = accountsRaw.map((a) => ({
    label: a.label,
    value: a.account_value,
    name: a.account_name,
  }))

  return (
    <div className="relative flex flex-col w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
      />

      <ScrollAmbient />
      <CustomCursor />

      <Hero />

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

      <DonateSection accounts={accounts} />
      <ContactSection portraitUrl={portraitUrl} />

      <Footer />
    </div>
  )
}
