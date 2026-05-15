import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Handles OAuth redirects AND email confirmation magic-links.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/auth?error=callback_failed`)
  }

  // Collect cookies that Supabase wants to set during the code exchange.
  // We CANNOT use cookies() from next/headers here because those go onto an
  // implicit response; the NextResponse.redirect() we return is a different
  // object and the browser would never receive the session cookies.
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
          // Buffer them — we'll attach to the redirect response below.
          pendingCookies.push(...cookiesToSet)
        },
      },
    },
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  // Determine where to redirect after the exchange.
  let redirectTo = `${origin}/auth?error=callback_failed`

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
        const profileComplete =
          meta?.profile_complete === true ||
          (meta?.username && meta?.domain && meta?.status)

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
