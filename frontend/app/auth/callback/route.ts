import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Handles OAuth redirects AND email confirmation magic-links.
/**
 * Normalise the origin so redirects never point at 0.0.0.0.
 * `next dev --hostname 0.0.0.0` makes `request.url` contain that
 * un-routable address; Zen (and most browsers) refuse to connect.
 */
function safeOrigin(requestUrl: string): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL
  if (envOrigin) return envOrigin.replace(/\/$/, '')

  const parsed = new URL(requestUrl)
  if (parsed.hostname === '0.0.0.0') parsed.hostname = 'localhost'
  return parsed.origin
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = safeOrigin(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const providerError = searchParams.get('error')
  const providerErrorDescription = searchParams.get('error_description')

  // If the OAuth provider returned an error (e.g. user cancelled)
  if (providerError || providerErrorDescription) {
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(providerErrorDescription || providerError || 'callback_failed')}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=Missing_auth_code`)
  }

  // Collect cookies that Supabase wants to set during the code exchange.
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          pendingCookies.push(...cookiesToSet)
        },
      },
    },
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('OAuth Callback Error:', error)
    return NextResponse.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`)
  }

  // Determine where to redirect after the exchange.
  let redirectTo = `${origin}/auth`

  if (!error && data.user) {
    if (type === 'recovery') {
      // Password recovery link — send to the set-new-password page.
      redirectTo = `${origin}/auth/update-password`
    } else {
      const meta = data.user.user_metadata

      // Email signup confirmation → success page.
      if (meta?.signup_flow === 'email') {
        redirectTo = `${origin}/auth/signup/success`
      } else {
        // OAuth sign-in: route incomplete profiles to onboarding.
        const profileComplete = meta?.profile_complete === true

        redirectTo = profileComplete
          ? `${origin}${next}`
          : `${origin}/auth/onboarding`
      }
    }
  }

  // Build the redirect and attach the session cookies so the browser receives them.
  const response = NextResponse.redirect(redirectTo)
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
