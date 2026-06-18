import { z } from 'zod'

export const EventModeEnum = z.enum(['online', 'physical'])
export const EventCategoryEnum = z.enum([
  'webinar', 'bootcamp', 'workshop', 'hackathon', 'seminar', 'conference', 'other',
])
export const EventStatusEnum = z.enum(['draft', 'published', 'cancelled', 'completed', 'archived'])

export type EventMode = z.infer<typeof EventModeEnum>
export type EventCategory = z.infer<typeof EventCategoryEnum>
export type EventStatus = z.infer<typeof EventStatusEnum>

export const CreateEventSchema = z.object({
  title:           z.string().min(3, 'Min 3 chars').max(100, 'Max 100 chars'),
  description:     z.string().min(20, 'Min 20 chars').max(2000, 'Max 2000 chars'),
  mode:            EventModeEnum,
  location_title:  z.string().min(2).max(100),
  location_link:   z.string().url('Must be a valid URL').optional().or(z.literal('')),
  category:        z.string().min(2).max(40),
  starts_at:       z.string().datetime({ offset: true }),
  ends_at:         z.string().datetime({ offset: true }),
  is_recurring:    z.boolean().default(false),
  recurrence_rule: z.string().optional().or(z.literal('')),
  recurrence_label:z.string().optional().or(z.literal('')),
  max_attendees:   z.number().int().positive().optional().nullable(),
  cert_enabled:    z.boolean().default(false),
  banner_url:      z.string().optional().or(z.literal('')),
  cert_template_url: z.string().optional().or(z.literal('')),
  status:          EventStatusEnum.default('draft'),
}).refine(
  (data) => new Date(data.ends_at) > new Date(data.starts_at),
  { message: 'End time must be after start time', path: ['ends_at'] },
).refine(
  (data) => new Date(data.ends_at).getTime() - new Date(data.starts_at).getTime() >= 15 * 60 * 1000,
  { message: 'Minimum duration is 15 minutes', path: ['ends_at'] },
)

export type CreateEventInput = z.infer<typeof CreateEventSchema>

export const RegisterEventSchema = z.object({
  event_id: z.string().uuid(),
})

export const GenerateCertSchema = z.object({
  event_id: z.string().uuid(),
  user_id: z.string().uuid(),
})

export const MarkAttendanceSchema = z.object({
  event_id: z.string().uuid(),
  user_ids: z.array(z.string().uuid()).min(1).max(500),
  attended: z.boolean(),
})

export interface EventRow {
  id: string
  title: string
  description: string
  mode: EventMode
  location_title: string
  location_link: string | null
  category: string
  starts_at: string
  ends_at: string
  status: EventStatus
  is_recurring: boolean
  recurrence_rule: string | null
  recurrence_label: string | null
  banner_url: string | null
  max_attendees: number | null
  cert_enabled: boolean
  cert_template_url: string | null
  created_at?: string
}

export const CATEGORY_COLOURS: Record<EventCategory, string> = {
  webinar:    '#3B82F6',
  bootcamp:   '#10B981',
  workshop:   '#F59E0B',
  hackathon:  '#A855F7',
  seminar:    '#06B6D4',
  conference: '#EC4899',
  other:      '#2D7FF9',
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  webinar:    'Webinar',
  bootcamp:   'Bootcamp',
  workshop:   'Workshop',
  hackathon:  'Hackathon',
  seminar:    'Seminar',
  conference: 'Conference',
  other:      'Other',
}
