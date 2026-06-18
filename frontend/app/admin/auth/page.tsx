'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { CodemoLogo } from '@/components/ui/CodemoLogo'
import { getTurnstileErrorMessage, getTurnstileSiteKey } from '@/lib/utils'
import { Turnstile } from '@marsidev/react-turnstile'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password too short'),
})
type FormData = z.infer<typeof schema>

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function AdminAuthInner() {
  const router = useRouter()
  const params = useSearchParams()
  const denied = params.get('denied') === '1'
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(denied ? 'Access denied. This account does not have admin privileges.' : null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    if (!turnstileToken) {
      setServerError('Please wait for the security check to complete.')
      return
    }

    setSubmitting(true)
    setServerError(null)
    const supabase = createClient()

    const { data: signIn, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
      options: { captchaToken: turnstileToken },
    })

    if (error || !signIn.session) {
      setSubmitting(false)
      setServerError('Invalid credentials.')
      setTurnstileToken(null)
      return
    }

    // TEMPORARY: role + MFA gates disabled. Any signed-in user reaches the dashboard.
    // RESTORE: re-enable role decode + MFA destination redirect from git history
    // when the JWT hook + MFA enforcement are wired up end-to-end.
    router.refresh()
    router.replace('/admin')
  }

  const inputCls = 'w-full h-[48px] rounded-xl px-4 text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-primary caret-accent-primary'

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-[400px] flex flex-col gap-6"
        style={{ background: 'var(--card-glass)', border: '1px solid var(--border)', borderRadius: 22, padding: 40 }}
      >
        <div className="flex flex-col items-center gap-4">
          <CodemoLogo width={140} />
          <span
            className="px-3 py-1 rounded-full uppercase tracking-wider"
            style={{ background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}
          >
            Admin
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-text-primary" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Admin Access
          </h1>
          <p className="text-text-muted mt-1" style={{ fontSize: 14 }}>
            Authorised personnel only.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-text-secondary" style={{ fontSize: 12, fontWeight: 500 }}>Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="you@codemoteam.org"
              className={inputCls}
              style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-text-error">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-text-secondary" style={{ fontSize: 12, fontWeight: 500 }}>Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${inputCls} pr-12`}
                style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.password && <p className="text-xs text-text-error">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-center text-sm text-text-error">{serverError}</p>}

          <div className="flex justify-center">
            <Turnstile
              siteKey={getTurnstileSiteKey()}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={(code) => setServerError(getTurnstileErrorMessage(String(code)))}
              onExpire={() => setTurnstileToken(null)}
              options={{ theme: 'dark' }}
            />
          </div>

          <Button
            variant="primary"
            className="w-full h-[48px] mt-1"
            disabled={submitting || !turnstileToken}
            aria-busy={submitting || !turnstileToken}
            onClick={handleSubmit(onSubmit)}
          >
            {submitting ? 'Signing in…' : (!turnstileToken ? 'Verifying security…' : 'Sign In')}
          </Button>

          <p className="text-center text-text-tertiary" style={{ fontSize: 11 }}>
            All admin actions are logged. Verification temporarily disabled for testing.
          </p>
        </form>
      </div>
    </main>
  )
}

export default function AdminAuthPage() {
  return (
    <Suspense fallback={null}>
      <AdminAuthInner />
    </Suspense>
  )
}
