import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_ROUTES = [
  '/profile',
  '/projects',
]

const AUTH_ROUTES = ['/auth']

function addSecurityHeaders(
  response: NextResponse,
  nonce: string,
): NextResponse {
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    } https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https: https://lh3.googleusercontent.com`,
    `connect-src 'self'`,
    `frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  )
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set(
    'Referrer-Policy',
    'strict-origin-when-cross-origin',
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('X-Nonce', nonce)

  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !token) {
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    return addSecurityHeaders(response, nonce)
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && token) {
    const response = NextResponse.redirect(new URL('/', request.url))
    return addSecurityHeaders(response, nonce)
  }

  const response = NextResponse.next()
  return addSecurityHeaders(response, nonce)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|public/).*)',
  ],
}
