'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/admin/roles'
import { getProfileForUser } from '@/lib/admin/auth'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sign in required.')
  const profile = await getProfileForUser(user.id)
  if (!profile || !isAdminRole(profile.role)) throw new Error('Forbidden.')
}

function db() {
  return createAdminClient()
}

export async function saveHomeFeaturedCoursesAction(courseIds: string[]): Promise<void> {
  await assertAdmin()
  const client = db()
  const existing = await client.from('home_featured_courses').select('id')
  if (existing.data?.length) {
    await client.from('home_featured_courses').delete().in('id', existing.data.map((r) => r.id))
  }
  if (courseIds.length > 0) {
    const { error } = await client.from('home_featured_courses').insert(
      courseIds.map((course_id, i) => ({ course_id, sort_order: i + 1 })),
    )
    if (error) throw new Error(error.message)
  }
  revalidatePath('/')
  revalidatePath('/admin/home')
}

export async function saveHomeFeaturedEventsAction(eventIds: string[]): Promise<void> {
  await assertAdmin()
  const client = db()
  const existing = await client.from('home_featured_events').select('id')
  if (existing.data?.length) {
    await client.from('home_featured_events').delete().in('id', existing.data.map((r) => r.id))
  }
  if (eventIds.length > 0) {
    const { error } = await client.from('home_featured_events').insert(
      eventIds.map((event_id, i) => ({ event_id, sort_order: i + 1 })),
    )
    if (error) throw new Error(error.message)
  }
  revalidatePath('/')
  revalidatePath('/admin/home')
}

export async function upsertDonationAccountAction(payload: {
  id?: string
  label: string
  account_value: string
  account_name: string
  sort_order: number
}): Promise<void> {
  await assertAdmin()
  const client = db()
  const row = {
    label: payload.label,
    account_value: payload.account_value,
    account_name: payload.account_name,
    sort_order: payload.sort_order,
  }
  const result = payload.id
    ? await client.from('donation_accounts').update(row).eq('id', payload.id)
    : await client.from('donation_accounts').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/')
  revalidatePath('/admin/home')
}

export async function deleteDonationAccountAction(id: string): Promise<void> {
  await assertAdmin()
  const { error } = await db().from('donation_accounts').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/home')
}

export async function saveContactPortraitAction(url: string): Promise<void> {
  await assertAdmin()
  const { error } = await db()
    .from('site_content')
    .upsert({ key: 'contact_portrait_url', value: { url: url.trim() } }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/home')
}

export async function upsertTestimonialAction(payload: {
  id?: string
  name: string
  role?: string
  content: string
  approved: boolean
  rating?: number
}): Promise<void> {
  await assertAdmin()
  const client = db()
  const row = {
    name: payload.name,
    role: payload.role ?? null,
    content: payload.content,
    approved: payload.approved,
    rating: payload.rating ?? 5,
  }
  const result = payload.id
    ? await client.from('testimonials').update(row).eq('id', payload.id)
    : await client.from('testimonials').insert(row)
  if (result.error) throw new Error(result.error.message)
  revalidatePath('/')
  revalidatePath('/admin/home')
}

export async function deleteTestimonialAction(id: string): Promise<void> {
  await assertAdmin()
  const { error } = await db().from('testimonials').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/admin/home')
}
