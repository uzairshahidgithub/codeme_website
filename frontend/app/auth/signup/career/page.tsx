'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { signupStep3Schema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { cn, getTurnstileErrorMessage, getTurnstileSiteKey } from '@/lib/utils'
import { Turnstile } from '@marsidev/react-turnstile'

type FormData = z.infer<typeof signupStep3Schema>

const DOMAINS = [
  'Software Engineering',
  'Cybersecurity',
  'Data Science',
  'Design',
  'Marketing',
  'Product Management',
  'DevOps',
  'Machine Learning',
  'Mobile Development',
  'Web Development',
  'Cloud Computing',
  'Blockchain',
  'Game Development',
  'Embedded Systems',
]

const STATUSES = ['Freelancer', 'Student', 'Employed', 'Unemployed', 'Business Owner'] as const

function DomainSelect({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value ?? '')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = DOMAINS.filter((d) => d.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="relative flex items-center h-14 rounded-[14px] cursor-text"
        style={{
          background: 'var(--input-glass)',
          border: '1px solid var(--border)',
          backdropFilter: 'var(--blur)',
          WebkitBackdropFilter: 'var(--blur)',
        }}
        onClick={() => setOpen(true)}
      >
        <input
          type="text"
          placeholder="Enter your career domain…"
          value={query}
          suppressHydrationWarning
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="w-full h-full bg-transparent px-5 text-text-primary placeholder:text-text-tertiary outline-none text-body font-sans caret-accent-primary"
          style={{ fontSize: '16px' }}
        />
        <svg
          className={cn('mr-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--text3)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-2 z-50 rounded-[14px] overflow-hidden overflow-y-auto max-h-[220px] py-1"
          style={{
            background: 'var(--card-glass)',
            border: '1px solid var(--border)',
            backdropFilter: 'var(--blur)',
            WebkitBackdropFilter: 'var(--blur)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}
        >
          {filtered.map((d) => (
            <button
              key={d}
              type="button"
              suppressHydrationWarning
              className="w-full text-left px-5 py-3 text-text-primary hover:bg-accent-primary hover:text-white transition-colors duration-100 text-body font-sans"
              style={{ fontSize: '15px' }}
              onMouseDown={(e) => {
                e.preventDefault()
                setQuery(d)
                onChange(d)
                setOpen(false)
              }}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-caption" style={{ color: '#ff5c5c', fontSize: '13px' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default function SignupStep3Page() {
  const router = useRouter()
  const { draft, setDomain, setStatus, setPassword } = useSignupStore()
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)

  // Guard: User must have completed details step before arriving here.
  useEffect(() => {
    if (!draft.email) {
      router.replace('/auth')
      return
    }
    if (!draft.username || !draft.gender || !draft.dob.yyyy) {
      router.replace('/auth/signup/details')
    }
  }, [draft.email, draft.username, draft.gender, draft.dob.yyyy, router])

  useEffect(() => {
    let cancelled = false

    createClient().auth.getSession().then(({ data }) => {
      if (cancelled) return
      const signedIn = !!data.session
      setHasSession(signedIn)
      if (signedIn && draft.password) setPassword('')
    })

    return () => {
      cancelled = true
    }
  }, [draft.password, setPassword])

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signupStep3Schema),
    defaultValues: { domain: draft.domain, status: draft.status },
  })

  const status = watch('status')
  const domain = watch('domain', '')
  const requiresTurnstile = !!draft.password && !hasSession

  async function onSubmit(data: FormData) {
    // Only the password-fallback branch calls signUp(), which the hosted
    // Supabase project gates behind CAPTCHA. OTP users hit updateUser(),
    // which needs no token.
    if (!turnstileToken && useSignupStore.getState().draft.password) {
      setSendError('Please wait for the security check to complete.')
      return
    }
    setSendError('')
    setSending(true)
    setDomain(data.domain)
    setStatus(data.status)

    const { draft: current } = useSignupStore.getState()

    const supabase = createClient()
    const metadata = {
      signup_flow: 'email',
      profile_complete: true,
      username: current.username,
      first_name: current.username,
      dob: `${current.dob.yyyy}-${current.dob.mm.padStart(2, '0')}-${current.dob.dd.padStart(2, '0')}`,
      gender: current.gender,
      domain: data.domain,
      status: data.status,
    }

    let error;

    if (current.password && !hasSession) {
      // User came through the password fallback flow — they are not authenticated yet.
      const res = await supabase.auth.signUp({
        email: current.email,
        password: current.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          captchaToken: turnstileToken || undefined,
          data: metadata,
        },
      })
      error = res.error
    } else {
      // User came through the primary OTP flow — they are already authenticated.
      const res = await supabase.auth.updateUser({
        data: metadata,
      })
      error = res.error
    }

    setSending(false)

    if (error) {
      setSendError(error.message)
      return
    }

    // TEMPORARY: email confirmation is disabled until SMTP is configured
    // (See supabase/config.toml [auth.email]). signUp() returns a live session
    // immediately, so we can skip /auth/signup/verify and land on the success
    // screen. Restore the verify route once email confirmation is re-enabled.
    router.refresh()
    router.replace('/auth/signup/success')
  }

  return (
    <>
      <div className="glass-card rounded-[22px] w-[calc(100%-64px)] lg:w-full max-w-[340px] lg:max-w-[420px] p-4 lg:p-8">
        {/* Domain */}
        <label
          className="block text-text-primary mb-3"
          style={{ fontSize: '18px', fontWeight: 500 }}
        >
          Select your Domain
        </label>
        <DomainSelect
          value={domain}
          onChange={(v) => setValue('domain', v)}
          error={errors.domain?.message}
        />

        {/* Current Status */}
        <fieldset className="mt-6">
          <legend
            className="text-text-primary mb-3"
            style={{ fontSize: '18px', fontWeight: 500 }}
          >
            Current Status
          </legend>
          <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Current status">
            {STATUSES.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={status === s}
                onClick={() => setValue('status', s)}
              />
            ))}
          </div>
          {errors.status && (
            <p className="mt-1.5 text-caption" style={{ color: '#ff5c5c', fontSize: '13px' }}>
              {errors.status.message}
            </p>
          )}
        </fieldset>

        {sendError && (
          <p className="mt-4 text-center text-sm" style={{ color: '#ff5c5c' }}>
            {sendError}
          </p>
        )}

        {/* Turnstile — required even on localhost because the hosted Supabase
            project enforces CAPTCHA on signUp() against the real secret. */}
        {requiresTurnstile && (
          <div className="mt-6 flex justify-center">
          <Turnstile
            siteKey={getTurnstileSiteKey()}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={(code) => setSendError(getTurnstileErrorMessage(String(code)))}
            onExpire={() => setTurnstileToken(null)}
            options={{ theme: 'dark' }}
          />
          </div>
        )}

        {/* Continue */}
        <div className="flex justify-center mt-8">
          <Button
            variant="primary"
            className="w-[200px]"
            onClick={handleSubmit(onSubmit)}
            disabled={sending || (!turnstileToken && requiresTurnstile)}
            aria-busy={sending || (!turnstileToken && requiresTurnstile)}
          >
            {sending ? 'Sending code…' : (!turnstileToken && !!useSignupStore.getState().draft.password ? 'Verifying security…' : 'Continue')}
          </Button>
        </div>
      </div>
    </>
  )
}
