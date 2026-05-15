import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Cookie-less anon client for cached server-side reads of public data
 * (events, testimonials, site_content, published courses).
 *
 * RLS still enforces the public/published filters defined in the migration.
 * Safe to use inside `unstable_cache` because no per-request cookies are touched.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
