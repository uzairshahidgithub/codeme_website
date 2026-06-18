'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSignupStore } from '@/stores/signup'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SocialButton } from '@/components/ui/SocialButton'
import { getOAuthOrigin, getTurnstileErrorMessage, getTurnstileSiteKey } from '@/lib/utils'
import { Turnstile } from '@marsidev/react-turnstile'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email(),
  otp: z.string().optional(),
})
type FormData = z.infer<typeof formSchema>

type Provider = 'google' | 'github'

function ErrorMessage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  if (!error) return null
  return (
    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-[13px] text-center font-medium">
      {decodeURIComponent(error).replace(/_/g, ' ')}
    </div>
  )
}

export default function AuthDefaultPage() {
  const router = useRouter()
  const setEmailStore = useSignupStore((s) => s.setEmail)
  const setPasswordStore = useSignupStore((s) => s.setPassword)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [checking, setChecking] = useState(false)
  const [serverError, setServerError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  // Locked to the address we actually sent the OTP to. Decoupling
  // from react-hook-form's `watch` makes verify resilient to any
  // re-render or autofill that could blank the form input.
  const [sentToEmail, setSentToEmail] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const currentEmail = watch('email', '')
  const otp = watch('otp', '')

  async function onSendOtp(data: FormData) {
    if (!turnstileToken) {
      setServerError('Please wait for the security check to complete.')
      return
    }

    setChecking(true)
    setServerError('')
    setEmailStore(data.email)
    // Make sure any stale password from a prior /auth/signup visit
    // is cleared — /career uses draft.password to decide signUp vs
    // updateUser, and an OTP user must take the updateUser branch.
    setPasswordStore('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: { captchaToken: turnstileToken || undefined },
    })

    if (error) {
      setServerError(error.message)
      setChecking(false)
      return
    }

    setSentToEmail(data.email)
    setStep('otp')
    setChecking(false)
  }

  async function onVerifyOtp(data: FormData) {
    const token = (data.otp ?? '').trim()
    const email = sentToEmail || data.email

    if (!email) {
      setServerError('Missing email — please request a new code.')
      return
    }
    if (!/^\d{6}$/.test(token)) {
      setServerError('Please enter the 6-digit code from your email.')
      return
    }

    setChecking(true)
    setServerError('')

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error || !authData?.session) {
      console.error('[OTP] verifyOtp failed', error)
      setServerError(error?.message ?? 'Verification failed. Please request a new code.')
      setChecking(false)
      return
    }

    // Pull fresh metadata — the JWT we just got back can lag for
    // brand-new users, so getUser() is the safe source of truth.
    const { data: userResult } = await supabase.auth.getUser()
    const meta = (userResult.user?.user_metadata ?? {}) as {
      profile_complete?: boolean
      username?: string
    }
    const profileComplete = meta.profile_complete === true && !!meta.username

    setEmailStore(email)
    router.refresh()
    router.replace(profileComplete ? '/' : '/auth/signup/details')
  }

  function backToEmail() {
    setStep('email')
    setServerError('')
    setSentToEmail('')
    setTurnstileToken(null)
    setValue('otp', '')
  }

  async function signInWithProvider(provider: Provider) {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getOAuthOrigin()}/auth/callback`,
      },
    })
  }

  return (
    <>
      {/* Card */}
      <div className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8">
        
        <Suspense fallback={null}>
          <ErrorMessage />
        </Suspense>

        {/* Email input */}
        <Input
          id="email"
          type="email"
          placeholder="Enter Email"
          autoComplete="email"
          error={errors.email?.message ?? (step === 'email' ? serverError : '')}
          readOnly={step === 'otp'}
          style={step === 'otp' ? { opacity: 0.6 } : undefined}
          {...register('email')}
        />

        {step === 'otp' && (
          <div className="mt-4">
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit code"
              autoComplete="one-time-code"
              maxLength={6}
              error={errors.otp?.message ?? serverError}
              {...register('otp')}
            />
            <p className="text-caption text-text-muted mt-2 text-center">
              We sent a one-time code to {sentToEmail || currentEmail}.
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <Turnstile
            siteKey={getTurnstileSiteKey()}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={(code) => setServerError(getTurnstileErrorMessage(String(code)))}
            onExpire={() => setTurnstileToken(null)}
            options={{ theme: 'dark' }}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-5">
          {step === 'email' ? (
            <Button
              variant="primary"
              className="w-full h-[56px] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
              onClick={handleSubmit(onSendOtp)}
              disabled={checking || !currentEmail || !turnstileToken}
              aria-busy={checking || !turnstileToken}
            >
              {checking ? 'Sending code…' : (!turnstileToken ? 'Verifying security…' : 'Continue with Email')}
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                className="w-full h-[56px] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                onClick={handleSubmit(onVerifyOtp)}
                disabled={checking || (otp?.length ?? 0) !== 6}
                aria-busy={checking}
              >
                {checking ? 'Verifying…' : 'Verify Code'}
              </Button>
              <Button
                variant="secondary"
                className="w-full h-[56px]"
                onClick={(e) => { e.preventDefault(); backToEmail(); }}
                disabled={checking}
              >
                Try Another Email
              </Button>
            </>
          )}
        </div>

        {/* Divider */}
        {step === 'email' && (
          <>
            <div className="mt-7 text-center">
              <span className="text-text-muted text-body-sm">or Continue via</span>
              <div className="mt-3 h-px bg-border-subtle" />
            </div>

            {/* Social providers */}
            <div className="flex justify-center gap-6 mt-5">
              <SocialButton provider="google" onClick={() => signInWithProvider('google')} />
              <SocialButton provider="github" onClick={() => signInWithProvider('github')} />
            </div>
          </>
        )}

        {/* Privacy Policy */}
        <div className="mt-6 text-center text-[12px] text-text-tertiary">
          By continuing, you agree to Codemo&apos;s{' '}
          <a href="#" className="underline hover:text-text-primary transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-text-primary transition-colors">
            Privacy Policy
          </a>
          .
        </div>

        {/* Fallback to Password Login */}
        <div className="mt-6 text-center">
          <p className="text-[13px] text-text-tertiary">
            Having trouble receiving codes?{' '}
            <Link href="/auth/login" className="text-text-link hover:underline font-medium">
              Use password login instead
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
