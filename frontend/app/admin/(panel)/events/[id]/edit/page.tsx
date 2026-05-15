import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventForm } from '@/components/admin/EventForm'
import type { EventRow } from '@/lib/schemas/events'

interface PageProps { params: Promise<{ id: string }> }

const SELECT_COLS =
  'id, title, description, mode, location_title, location_link, category, starts_at, ends_at, status, is_recurring, recurrence_rule, recurrence_label, banner_url, max_attendees, cert_enabled, cert_template_url'

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: row } = await supabase.from('events').select(SELECT_COLS).eq('id', id).single()
  if (!row) notFound()
  const event = row as EventRow

  return (
    <div className="px-6 md:px-10 py-8 max-w-[900px] mx-auto w-full">
      <header className="mb-8">
        <span className="home-mono-eyebrow">admin · events · edit</span>
        <h1 className="text-text-primary mt-2" style={{ fontSize: 28, fontWeight: 700 }}>Edit Event</h1>
      </header>
      <EventForm
        mode="edit"
        initial={{
          id: event.id,
          title: event.title,
          description: event.description,
          mode: event.mode,
          location_title: event.location_title,
          location_link: event.location_link ?? '',
          category: event.category,
          starts_at: event.starts_at,
          ends_at: event.ends_at,
          is_recurring: event.is_recurring,
          recurrence_rule: event.recurrence_rule ?? '',
          recurrence_label: event.recurrence_label ?? '',
          banner_url: event.banner_url ?? '',
          max_attendees: event.max_attendees ?? null,
          cert_enabled: event.cert_enabled,
          cert_template_url: event.cert_template_url ?? '',
          status: event.status,
        }}
      />
    </div>
  )
}
