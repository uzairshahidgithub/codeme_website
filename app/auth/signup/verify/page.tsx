'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ReCAPTCHA from 'react-google-recaptcha'
import { z } from 'zod'
import { verifyCodeSchema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup'
import { Button } from '@/components/ui/Button'

type FormData = z.infer<typeof verifyCodeSchema>

export default function SignupVerifyPage() {
  const router = useRouter()
  const { draft, clearDraft } = useSignupStore()
  const recaptchaRef = useRef<ReCAPTCHA>(null)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const codeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    codeInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(verifyCodeSchema),
  })
  const { ref: formRef, ...restRegister } = register('code')

  async function onSubmit(data: FormData) {
    setServerError('')
    setLoading(true)

    const token = recaptchaRef.current?.getValue() ?? ''

    // Verify code
    const verifyRes = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: draft.email, code: data.code, recaptchaToken: token }),
    })

    if (!verifyRes.ok) {
      const json = await verifyRes.json() as { error: string }
      setServerError(json.error ?? 'Invalid code')
      recaptchaRef.current?.reset()
      setLoading(false)
      return
    }

    // Create user
    const dobDate = new Date(
      +draft.dob.yyyy,
      +draft.dob.mm - 1,
      +draft.dob.dd,
    ).toISOString()

    const signupRes = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: draft.email,
        password: draft.password,
        dob: dobDate,
        username: draft.username,
        gender: draft.gender,
        domain: draft.domain,
        status: draft.status,
      }),
    })

    if (!signupRes.ok) {
      const json = await signupRes.json() as { error: string }
      setServerError(json.error ?? 'Signup failed')
      setLoading(false)
      return
    }

    clearDraft()
    router.replace('/auth/signup/success')
  }

  async function handleResend() {
    await fetch('/api/auth/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: draft.email }),
    })
    setResendCooldown(60)
  }

  return (
    <>
      <div
        className="glass-card rounded-[22px] w-[calc(100%-64px)] lg:w-full max-w-[340px] lg:max-w-[420px] p-4 lg:p-8"
      >
        <label
          htmlFor="code"
          className="block text-text-primary mb-3"
          style={{ fontSize: '18px', fontWeight: 500 }}
        >
          Enter Confirmation Code
        </label>

        <input
          id="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Check your Email Inbox"
          autoComplete="one-time-code"
          aria-describedby={serverError ? 'code-error' : undefined}
          aria-invalid={!!serverError}
          className="w-full h-14 rounded-pill bg-bg-input px-6 text-body text-text-primary placeholder:text-text-tertiary border border-transparent outline-none focus:border-accent-primary caret-accent-primary"
          ref={(el) => {
            formRef(el)
            ;(codeInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el
          }}
          {...restRegister}
        />
        {(errors.code || serverError) && (
          <p id="code-error" role="alert" className="mt-1.5 text-caption text-text-error">
            {errors.code?.message ?? serverError}
          </p>
        )}

        {/* Resend link */}
        <div className="mt-3 text-center">
          {resendCooldown > 0 ? (
            <span className="text-caption text-text-muted">
              Resend in {resendCooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-caption text-text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded"
            >
              Didn&apos;t receive a code? Resend
            </button>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <Button
            variant="primary"
            className="w-[200px]"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Verifying…' : 'Continue'}
          </Button>
        </div>
      </div>

      {/* reCAPTCHA */}
      <div
        className="glass-card rounded-[22px] flex items-center justify-center mt-4 lg:mt-8 w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] h-[96px]"
      >
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
          theme="dark"
        />
      </div>
    </>
  )
}
