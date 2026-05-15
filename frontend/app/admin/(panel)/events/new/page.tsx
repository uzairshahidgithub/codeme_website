import { EventForm } from '@/components/admin/EventForm'

export default function NewEventPage() {
  return (
    <div className="px-6 md:px-10 py-8 max-w-[900px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · events · new</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Create Event</h1>
      </header>
      <EventForm mode="create" />
    </div>
  )
}
