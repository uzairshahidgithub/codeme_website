'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSignupStore } from '@/stores/signup'
import { Button } from '@/components/ui/Button'
import { getTurnstileErrorMessage, getTurnstileSiteKey } from '@/lib/utils'
import { Turnstile } from '@marsidev/react-turnstile'

function VerifyInner() {
  const router = useRouter()
  const params = useSearchParams()
  const emailFromQuery = params.get('email') ?? ''
  const draftEmail = useSignupStore((s) => s.draft.email)
  const email = emailFromQuery || draftEmail

  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  async function resend() {
    if (!email) {
      setError('Missing email address. Start signup again.')
      return
    }
    if (!turnstileToken) {
      setError('Please wait for the security check to complete.')
      return
    }

    setResending(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { captchaToken: turnstileToken },
    })

    setResending(false)
    if (resendError) {
      setError(resendError.message)
      setTurnstileToken(null)
      return
    }
    setMessage('Confirmation email sent. Check your inbox and spam folder.')
  }

  return (
    <div className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8 flex flex-col gap-5 text-center">
      <div
        className="flex items-center justify-center rounded-full mx-auto"
        style={{ width: 64, height: 64, background: 'rgba(26,72,254,0.12)', border: '1.5px solid rgba(26,72,254,0.25)' }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>

      <div>
        <h2 className="text-text-primary" style={{ fontSize: 20, fontWeight: 600 }}>Verify your email</h2>
        <p className="text-text-tertiary mt-3 leading-relaxed" style={{ fontSize: 14 }}>
          We sent a confirmation link to{' '}
          <strong className="text-text-secondary">{email || 'your email'}</strong>.
          Click the link in that email to activate your account.
        </p>
      </div>

      {message && <p className="text-sm text-text-secondary">{message}</p>}
      {error && <p className="text-sm text-text-error">{error}</p>}

      <div className="flex justify-center">
        <Turnstile
          siteKey={getTurnstileSiteKey()}
          onSuccess={(token) => setTurnstileToken(token)}
          onError={(code) => setError(getTurnstileErrorMessage(String(code)))}
          onExpire={() => setTurnstileToken(null)}
          options={{ theme: 'dark' }}
        />
      </div>

      <Button
        variant="primary"
        className="w-full h-[48px]"
        disabled={resending || !turnstileToken || !email}
        onClick={resend}
      >
        {resending ? 'Sending…' : 'Resend confirmation email'}
      </Button>

      <p className="text-[12px] text-text-tertiary">
        Already confirmed?{' '}
        <button
          type="button"
          className="text-text-link hover:underline"
          onClick={() => router.replace('/auth/login')}
        >
          Sign in
        </button>
      </p>

      <Link href="/auth" className="text-text-link hover:underline text-sm">
        Back to sign up
      </Link>
    </div>
  )
}

export default function SignupVerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  )
}
