import { EventsClient } from '@/components/events/EventsClient'

export const dynamic = 'force-dynamic'

export default function EventsPage() {
  return (
    <div className="px-4 md:px-10 py-6 md:py-8 max-w-[1400px] mx-auto w-full">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-8 md:mb-14">
        <div className="min-w-0">
          <h1 className="font-sans font-semibold tracking-normal text-text-primary leading-snug text-2xl md:text-4xl lg:text-5xl">
            Community Events.
          </h1>
          <p className="mt-3 text-text-secondary max-w-prose font-normal text-sm md:text-lg leading-[1.5]">
            Browse upcoming and past events. Click any event for details and to register.
          </p>
        </div>
      </header>

      <EventsClient />
    </div>
  )
}
