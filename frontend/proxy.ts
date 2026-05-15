import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const PROTECTED_ROUTES = [
  '/profile',
  '/projects',
]

// These /auth/* paths are reachable while a session exists (post-login flows).
// `/admin` is excluded from the profile-completeness guard — admin pages do
// their own role + MFA gating in lib/admin/auth.ts.
const AUTH_ROUTE_EXCEPTIONS = [
  '/auth/callback',
  '/auth/onboarding',
  '/auth/signup/verify',
  '/auth/signup/success',
  '/auth/signup/career',
  '/auth/update-password',
  '/auth/reset-password',
  '/admin',
]

const AUTH_ROUTES = ['/auth']

function addSecurityHeaders(response: NextResponse, nonce: string): NextResponse {
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    } https://challenges.cloudflare.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com`,
    `frame-src https://challenges.cloudflare.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Nonce', nonce)

  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Build a mutable response that Supabase can attach refreshed session cookies to.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // getUser() validates the session server-side (never trusts the client cookie alone).
  // It can throw on a stale refresh token (e.g. token-not-found, token-expired). Treat
  // any throw as "signed out" — the proxy will re-issue auth cookies via setAll if needed.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch {
    user = null
  }

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (isProtected && !user) {
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return addSecurityHeaders(NextResponse.redirect(loginUrl), nonce)
  }

  const isAuthException = AUTH_ROUTE_EXCEPTIONS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (isAuthRoute && !isAuthException && user) {
    return addSecurityHeaders(NextResponse.redirect(new URL('/', request.url)), nonce)
  }

  // Guard: authenticated user whose profile is incomplete must finish onboarding.
  // Email-signup users have no session until email confirmation, so this only
  // fires for OAuth users who abandoned /auth/onboarding mid-flow.
  if (user && pathname !== '/auth/onboarding' && !isAuthException) {
    const meta = user.user_metadata as {
      profile_complete?: boolean
      username?: string
      domain?: string
      status?: string
    } | undefined

    const profileIncomplete =
      !meta?.profile_complete &&
      !(meta?.username && meta?.domain && meta?.status)

    if (profileIncomplete) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/auth/onboarding', request.url)),
        nonce,
      )
    }
  }

  return addSecurityHeaders(supabaseResponse, nonce)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|public/).*) '],
}
