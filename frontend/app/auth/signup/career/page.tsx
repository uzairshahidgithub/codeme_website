'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signupStep3Schema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

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

/** Custom glass dropdown to replace native datalist */
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

  const filtered = DOMAINS.filter((d) =>
    d.toLowerCase().includes(query.toLowerCase())
  )

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
      {/* Input */}
      <div
        className="relative flex items-center h-14 rounded-[14px] cursor-text"
        style={{
          background: 'var(--input-glass)',
          border: '1px solid var(--border)',
          backdropFilter: 'var(--blur)',
          WebkitBackdropFilter: 'var(--blur)',
        }}
        onClick={() => { setOpen(true) }}
      >
        <input
          type="text"
          placeholder="Enter your career domain…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="w-full h-full bg-transparent px-5 text-text-primary placeholder:text-text-tertiary outline-none text-body font-sans caret-accent-primary"
          style={{ fontSize: '16px' }}
        />
        {/* Chevron */}
        <svg
          className={cn('mr-4 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--text3)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown list */}
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
  const { draft, setDomain, setStatus } = useSignupStore()
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

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

  async function sendCode(): Promise<boolean> {
    try {
      const { draft } = useSignupStore.getState()
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: draft.email }),
      })

      if (!res.ok) {
        const text = await res.text()
        let msg = 'Failed to send verification code'
        try { msg = JSON.parse(text).error ?? msg } catch {}
        setSendError(msg)
        return false
      }
      return true
    } catch (e) {
      setSendError('Network error. Please check your connection.')
      return false
    }
  }

  async function onSubmit(data: FormData) {
    setSendError('')
    setSending(true)
    setDomain(data.domain)
    setStatus(data.status)
    const ok = await sendCode()
    setSending(false)
    if (ok) router.push('/auth/signup/verify')
  }

  return (
    <>
      <div
        className="glass-card rounded-[22px] w-[calc(100%-64px)] lg:w-full max-w-[340px] lg:max-w-[420px] p-4 lg:p-8"
      >
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

        {/* Error */}
        {sendError && (
          <p className="mt-4 text-center text-sm" style={{ color: '#ff5c5c' }}>{sendError}</p>
        )}

        {/* Continue */}
        <div className="flex justify-center mt-8">
          <Button
            variant="primary"
            className="w-[200px]"
            onClick={handleSubmit(onSubmit)}
            disabled={sending}
            aria-busy={sending}
          >
            {sending ? 'Sending code…' : 'Continue'}
          </Button>
        </div>
      </div>
    </>
  )
}
