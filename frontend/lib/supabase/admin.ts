import { createClient } from '@supabase/supabase-js'

// Service-role client — server-only, never sent to the browser.
// Used only in Route Handlers (API routes) that need admin access.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
