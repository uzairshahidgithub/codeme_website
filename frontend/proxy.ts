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
  '/auth/signup/details',
  '/auth/signup/career',
  '/auth/update-password',
  '/auth/reset-password',
  '/admin',
]

const AUTH_ROUTES = ['/auth']

/* Detects phone / tablet user agents. Used to gate admin
   routes off the mobile experience entirely — the admin
   panel is desktop-only (heavy tables, MFA flows, audit
   tooling) and isn't designed to be operated from a phone.
   We do this in the proxy so the redirect happens BEFORE
   the admin layout boots and reads cookies / hits supabase. */
const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i
function isMobileUA(request: NextRequest): boolean {
  const ua = request.headers.get('user-agent') ?? ''
  return MOBILE_UA.test(ua)
}

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
  // If the user's browser somehow accesses the dev server via 0.0.0.0
  // (which Zen browser blocks on OAuth redirects), force them to localhost.
  if (request.nextUrl.hostname === '0.0.0.0') {
    const newUrl = new URL(request.url)
    newUrl.hostname = 'localhost'
    return NextResponse.redirect(newUrl)
  }

  const { pathname } = request.nextUrl
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Admin panel is desktop-only. Mobile clients are bounced
  // back to home BEFORE supabase auth runs — no admin route
  // (including its auth/MFA pages) is reachable from a phone.
  if (pathname.startsWith('/admin') && isMobileUA(request)) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/', request.url)),
      nonce,
    )
  }

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
  if (user && pathname !== '/auth/signup/details' && !isAuthException) {
    const meta = user.user_metadata as {
      profile_complete?: boolean
    } | undefined

    if (!meta?.profile_complete) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/auth/signup/details', request.url)),
        nonce,
      )
    }
  }

  return addSecurityHeaders(supabaseResponse, nonce)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|public/).*) '],
}
