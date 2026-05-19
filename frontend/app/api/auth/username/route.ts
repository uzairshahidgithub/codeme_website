import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const querySchema = z
  .string()
  .min(3, 'At least 3 characters')
  .max(20, 'Max 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers & underscores')

/**
 * GET /api/auth/username?q=desired_username[&uid=current_user_id]
 *
 * Checks whether a username is available. Uses a DUAL check:
 *   1. profiles table (UNIQUE constraint — source of truth for registered users)
 *   2. auth.users metadata (catches users whose profile row hasn't been created yet,
 *      e.g. the brief window between auth signup and trigger execution)
 *
 * The optional `uid` parameter excludes the caller's own row so editing
 * your own profile doesn't flag your existing username as taken.
 */
export async function GET(request: NextRequest) {
  const q   = request.nextUrl.searchParams.get('q') ?? ''
  const uid = request.nextUrl.searchParams.get('uid') ?? ''

  const parsed = querySchema.safeParse(q)
  if (!parsed.success) {
    return NextResponse.json(
      { available: false, error: parsed.error.issues[0]?.message ?? 'Invalid username format' },
      { status: 400 },
    )
  }

  const username = parsed.data.toLowerCase()
  const supabase = createAdminClient()

  // ── Check 1: profiles table (UNIQUE constraint) ──────────────────────────
  let profileQuery = supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .ilike('username', username)

  if (uid) profileQuery = profileQuery.neq('id', uid)

  const { count: profileCount, error: profileError } = await profileQuery

  if (profileError) {
    console.error('[username-check] profiles query failed:', profileError.message)
    // Don't block — fall through to auth check
  } else if ((profileCount ?? 0) > 0) {
    return NextResponse.json({ available: false })
  }

  // ── Check 2: auth.users metadata (covers users without a profile row yet) ─
  // listUsers is paginated to 1000 by default; for large scale replace with
  // a DB function. Fine for now since profiles is the primary check.
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  })

  if (authError) {
    console.error('[username-check] auth.admin.listUsers failed:', authError.message)
    // If both checks fail, be conservative and say unavailable
    return NextResponse.json(
      { available: false, error: 'Service unavailable' },
      { status: 500 },
    )
  }

  const taken = (authData?.users ?? []).some((u) => {
    // Skip the caller's own account
    if (uid && u.id === uid) return false
    const meta = u.user_metadata as Record<string, unknown> | undefined
    const metaUsername = typeof meta?.username === 'string' ? meta.username.toLowerCase() : ''
    return metaUsername === username
  })

  return NextResponse.json({ available: !taken })
}
