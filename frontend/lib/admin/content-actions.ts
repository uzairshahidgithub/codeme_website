'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateEventSchema, type CreateEventInput } from '@/lib/schemas/events'
import { CourseSchema, type CourseInput } from '@/lib/schemas/courses'
import { CategorySchema, type CategoryInput } from '@/lib/schemas/categories'

async function assertAdminSession() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('You must be signed in to perform this action.')
  }
  return user
}

function adminDb() {
  return createAdminClient()
}

export async function upsertEventAction(
  payload: CreateEventInput & { id?: string },
): Promise<{ id: string }> {
  await assertAdminSession()
  const parsed = CreateEventSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    throw new Error(msg ?? 'Invalid event data')
  }

  const dbPayload = {
    ...parsed.data,
    location_link: parsed.data.location_link || null,
    recurrence_rule: parsed.data.recurrence_rule || null,
    recurrence_label: parsed.data.recurrence_label || null,
    banner_url: parsed.data.banner_url || null,
    cert_template_url: parsed.data.cert_template_url || null,
    max_attendees: parsed.data.max_attendees ?? null,
    date: parsed.data.starts_at,
  }

  const supabase = adminDb()
  const result = payload.id
    ? await supabase.from('events').update(dbPayload).eq('id', payload.id).select('id').single()
    : await supabase.from('events').insert(dbPayload).select('id').single()

  if (result.error) throw new Error(result.error.message)

  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/')
  return { id: result.data.id }
}

export async function deleteEventAction(id: string): Promise<void> {
  await assertAdminSession()
  const { error } = await adminDb().from('events').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/events')
  revalidatePath('/events')
  revalidatePath('/')
}

export async function upsertCourseAction(
  payload: CourseInput & { id?: string },
): Promise<{ id: string }> {
  await assertAdminSession()
  const parsed = CourseSchema.safeParse(payload)
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    throw new Error(msg ?? 'Invalid course data')
  }

  const dbPayload = {
    ...parsed.data,
    thumbnail_url: parsed.data.thumbnail_url || null,
    instructor_avatar_url: parsed.data.instructor_avatar_url || null,
    category: parsed.data.category || null,
    tags: parsed.data.tags ?? [],
  }

  const supabase = adminDb()
  const result = payload.id
    ? await supabase.from('courses').update(dbPayload).eq('id', payload.id).select('id').single()
    : await supabase.from('courses').insert(dbPayload).select('id').single()

  if (result.error) throw new Error(result.error.message)

  revalidatePath('/admin/courses')
  revalidatePath('/')
  return { id: result.data.id }
}

export async function deleteCourseAction(id: string): Promise<void> {
  await assertAdminSession()
  const { error } = await adminDb().from('courses').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/courses')
  revalidatePath('/')
}

export async function upsertCategoryAction(
  payload: CategoryInput & { id?: string },
): Promise<{ id: string }> {
  await assertAdminSession()
  const parsed = CategorySchema.safeParse(payload)
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
    throw new Error(msg ?? 'Invalid category data')
  }

  const supabase = adminDb()
  const result = payload.id
    ? await supabase.from('content_categories').update(parsed.data).eq('id', payload.id).select('id').single()
    : await supabase.from('content_categories').insert(parsed.data).select('id').single()

  if (result.error) throw new Error(result.error.message)

  revalidatePath('/admin/categories')
  revalidatePath('/admin/events')
  revalidatePath('/admin/courses')
  revalidatePath('/events')
  return { id: result.data.id }
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await assertAdminSession()
  const { error } = await adminDb().from('content_categories').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categories')
  revalidatePath('/events')
}
