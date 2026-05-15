'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useDebouncedCallback } from 'use-debounce'

const DOMAINS = [
  'Software Engineering', 'Cybersecurity', 'Data Science', 'Design',
  'Marketing', 'Product Management', 'DevOps', 'Machine Learning',
  'Mobile Development', 'Web Development', 'Cloud Computing', 'Blockchain',
  'Game Development', 'Embedded Systems',
]
const STATUSES = ['Freelancer', 'Student', 'Employed', 'Unemployed', 'Business Owner'] as const
const GENDERS = ['Male', 'Female', 'Not Listed'] as const

const schema = z.object({
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'Max 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  dobDd: z.string().regex(/^\d{1,2}$/).refine((v) => +v >= 1 && +v <= 31, 'Invalid day'),
  dobMm: z.string().regex(/^\d{1,2}$/).refine((v) => +v >= 1 && +v <= 12, 'Invalid month'),
  dobYyyy: z.string().regex(/^\d{4}$/).refine((v) => +v >= 1900 && +v <= new Date().getFullYear(), 'Invalid year'),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Select a gender' }) }),
  domain: z.string().min(2, 'Select a domain'),
  status: z.enum(STATUSES, { errorMap: () => ({ message: 'Select a status' }) }),
})
type FormData = z.infer<typeof schema>

function DomainSelect({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value ?? '')
  const ref = useRef<HTMLDivElement>(null)
  const filtered = DOMAINS.filter((d) => d.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div
        className="relative flex items-center h-12 rounded-[14px] cursor-text"
        style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
        onClick={() => setOpen(true)}
      >
        <input
          type="text" placeholder="Career domain…" value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full h-full bg-transparent px-4 text-text-primary placeholder:text-text-tertiary outline-none text-body caret-accent-primary"
          style={{ fontSize: 15 }}
        />
        <svg className={cn('mr-3 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 z-50 rounded-[14px] overflow-hidden overflow-y-auto max-h-[180px] py-1"
          style={{ background: 'var(--card-glass)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          {filtered.map((d) => (
            <button key={d} type="button"
              className="w-full text-left px-4 py-2.5 text-text-primary hover:bg-accent-primary hover:text-white transition-colors text-body"
              style={{ fontSize: 14 }}
              onMouseDown={(e) => { e.preventDefault(); setQuery(d); onChange(d); setOpen(false) }}>
              {d}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-caption text-text-error">{error}</p>}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: undefined, status: undefined },
  })

  const gender = watch('gender')
  const status = watch('status')
  const domain = watch('domain', '')
  const username = watch('username', '')

  const checkUsername = useDebouncedCallback(async (val: string) => {
    if (val.length < 3) { setUsernameAvailable(null); return }
    setCheckingUsername(true)
    try {
      const res = await fetch(`/api/auth/username?q=${encodeURIComponent(val)}`)
      const json = (await res.json()) as { available: boolean }
      setUsernameAvailable(json.available)
    } finally { setCheckingUsername(false) }
  }, 400)

  async function onSubmit(data: FormData) {
    setServerError('')
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: {
        profile_complete: true,
        username: data.username,
        first_name: data.username,
        dob: `${data.dobYyyy}-${data.dobMm.padStart(2, '0')}-${data.dobDd.padStart(2, '0')}`,
        gender: data.gender,
        domain: data.domain,
        status: data.status,
      },
    })

    setSaving(false)
    if (error) { setServerError(error.message); return }
    // Flush the updated session token to cookies before navigating so the
    // proxy's profile-completeness check passes on the very next request.
    router.refresh()
    router.replace('/auth/signup/success')
  }

  return (
    <div className="glass-card rounded-[22px] w-[calc(100%-64px)] lg:w-full max-w-[360px] lg:max-w-[440px] p-4 lg:p-7 flex flex-col gap-5">
      <div>
        <h2 className="text-text-primary" style={{ fontSize: 20, fontWeight: 600 }}>Complete your profile</h2>
        <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>Just a few more details to get you started.</p>
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-text-secondary mb-2" style={{ fontSize: 14, fontWeight: 500 }}>Username</label>
        <div className="relative">
          <input id="username" type="text" placeholder="e.g. john_doe" autoComplete="username"
            className="w-full h-11 rounded-xl px-4 text-body text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-primary caret-accent-primary"
            style={{ background: 'var(--input-glass)', border: '1px solid var(--border)', fontSize: 15 }}
            {...register('username', { onChange: (e) => checkUsername(e.target.value) })}
          />
          {username.length >= 3 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-caption">
              {checkingUsername ? '…' : usernameAvailable === true ? <span className="text-green-400">✓</span> : usernameAvailable === false ? <span className="text-text-error">✗ taken</span> : null}
            </span>
          )}
        </div>
        {errors.username && <p className="mt-1 text-caption text-text-error">{errors.username.message}</p>}
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-text-secondary mb-2" style={{ fontSize: 14, fontWeight: 500 }}>Date of Birth</label>
        <div className="flex gap-2">
          {[{ name: 'dobDd' as const, placeholder: 'DD', max: 2, w: 'w-16' },
            { name: 'dobMm' as const, placeholder: 'MM', max: 2, w: 'w-16' },
            { name: 'dobYyyy' as const, placeholder: 'YYYY', max: 4, w: 'w-24' }].map(({ name, placeholder, max, w }) => (
            <input key={name} placeholder={placeholder} inputMode="numeric" maxLength={max}
              className={`${w} h-11 rounded-xl text-center text-body text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-primary`}
              style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
              {...register(name)}
            />
          ))}
        </div>
        {(errors.dobDd || errors.dobMm || errors.dobYyyy) && (
          <p className="mt-1 text-caption text-text-error">{errors.dobDd?.message ?? errors.dobMm?.message ?? errors.dobYyyy?.message}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-text-secondary mb-2" style={{ fontSize: 14, fontWeight: 500 }}>Gender</label>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => <Chip key={g} label={g} selected={gender === g} onClick={() => setValue('gender', g)} />)}
        </div>
        {errors.gender && <p className="mt-1 text-caption text-text-error">{errors.gender.message}</p>}
      </div>

      {/* Domain */}
      <div>
        <label className="block text-text-secondary mb-2" style={{ fontSize: 14, fontWeight: 500 }}>Career Domain</label>
        <DomainSelect value={domain} onChange={(v) => setValue('domain', v)} error={errors.domain?.message} />
      </div>

      {/* Status */}
      <div>
        <label className="block text-text-secondary mb-2" style={{ fontSize: 14, fontWeight: 500 }}>Current Status</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => <Chip key={s} label={s} selected={status === s} onClick={() => setValue('status', s)} />)}
        </div>
        {errors.status && <p className="mt-1 text-caption text-text-error">{errors.status.message}</p>}
      </div>

      {serverError && <p className="text-center text-sm text-text-error">{serverError}</p>}

      <div className="flex justify-center pt-1">
        <Button variant="primary" className="w-[200px] h-[50px] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
          onClick={handleSubmit(onSubmit)} disabled={saving} aria-busy={saving}>
          {saving ? 'Saving…' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  )
}
