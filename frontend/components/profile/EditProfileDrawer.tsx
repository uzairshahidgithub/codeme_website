'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/utils'

const DOMAINS = [
  'Software Engineering', 'Cybersecurity', 'Data Science', 'Design',
  'Marketing', 'Product Management', 'DevOps', 'Machine Learning',
  'Mobile Development', 'Web Development', 'Cloud Computing', 'Blockchain',
  'Game Development', 'Embedded Systems',
]
const STATUSES = ['Freelancer', 'Student', 'Employed', 'Unemployed', 'Business Owner'] as const
const GENDERS = ['Male', 'Female', 'Not Listed'] as const

const schema = z.object({
  firstName: z.string().min(1, 'Name is required').max(50, 'Max 50 characters'),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(20, 'Max 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscores only'),
  dobDd: z.string().regex(/^\d{1,2}$/).refine((v) => +v >= 1 && +v <= 31, 'Invalid day'),
  dobMm: z.string().regex(/^\d{1,2}$/).refine((v) => +v >= 1 && +v <= 12, 'Invalid month'),
  dobYyyy: z.string().regex(/^\d{4}$/).refine(
    (v) => +v >= 1900 && +v <= new Date().getFullYear() - 13,
    'Must be at least 13 years old',
  ),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: 'Select a gender' }) }),
  domain: z.string().min(1, 'Select a domain'),
  status: z.enum(STATUSES, { errorMap: () => ({ message: 'Select a status' }) }),
})
type FormData = z.infer<typeof schema>

function DomainSelect({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value ?? '')
  const filtered = DOMAINS.filter((d) => d.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative">
      <div
        className="relative flex items-center h-[48px] rounded-xl cursor-text"
        style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
        onClick={() => setOpen(true)}
      >
        <input
          type="text"
          placeholder="Career domain…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full h-full bg-transparent px-4 text-text-primary placeholder:text-text-tertiary outline-none caret-accent-primary"
          style={{ fontSize: 14 }}
          aria-label="Career domain"
        />
        <svg
          className={cn('mr-3 shrink-0 transition-transform duration-200', open && 'rotate-180')}
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)' }} aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden overflow-y-auto max-h-[180px] py-1"
          style={{ background: 'var(--card-glass)', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
        >
          {filtered.map((d) => (
            <button
              key={d}
              type="button"
              className="w-full text-left px-4 py-2.5 text-text-primary hover:bg-accent-primary hover:text-white transition-colors"
              style={{ fontSize: 13 }}
              onMouseDown={(e) => { e.preventDefault(); setQuery(d); onChange(d); setOpen(false) }}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-text-error">{error}</p>}
    </div>
  )
}

function Field({ id, label, children, error }: { id?: string; label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-text-secondary" style={{ fontSize: 12, fontWeight: 500 }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-text-error">{error}</p>}
    </div>
  )
}

interface EditProfileDrawerProps {
  open: boolean
  onClose: () => void
}

export function EditProfileDrawer({ open, onClose }: EditProfileDrawerProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [loading, setLoading] = useState(true)
  const [originalUsername, setOriginalUsername] = useState('')

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const gender = watch('gender')
  const status = watch('status')
  const domain = watch('domain', '')
  const username = watch('username', '')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setServerError('')
    setSuccess(false)
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const meta = user.user_metadata as Record<string, string | undefined>
      const dob = meta.dob ?? ''
      const [yyyy, mm, dd] = dob ? dob.split('-') : ['', '', '']
      reset({
        firstName: meta.first_name ?? '',
        username: meta.username ?? '',
        dobDd: dd ?? '',
        dobMm: mm ?? '',
        dobYyyy: yyyy ?? '',
        gender: (meta.gender as typeof GENDERS[number]) ?? undefined,
        domain: meta.domain ?? '',
        status: (meta.status as typeof STATUSES[number]) ?? undefined,
      })
      setOriginalUsername(meta.username ?? '')
      setLoading(false)
    }
    void load()
  }, [open, reset])

  const checkUsername = useDebouncedCallback(async (val: string) => {
    if (val === originalUsername) { setUsernameAvailable(null); return }
    if (val.length < 3) { setUsernameAvailable(null); return }
    setCheckingUsername(true)
    try {
      const res = await fetch(`/api/auth/username?q=${encodeURIComponent(val)}`)
      const json = (await res.json()) as { available: boolean }
      setUsernameAvailable(json.available)
    } finally { setCheckingUsername(false) }
  }, 400)

  async function onSubmit(data: FormData) {
    if (usernameAvailable === false) return
    setServerError('')
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: data.firstName,
        username: data.username,
        dob: `${data.dobYyyy}-${data.dobMm.padStart(2, '0')}-${data.dobDd.padStart(2, '0')}`,
        gender: data.gender,
        domain: data.domain,
        status: data.status,
      },
    })
    setSaving(false)
    if (error) { setServerError(error.message); return }
    setOriginalUsername(data.username)
    setSuccess(true)
    router.refresh()
    setTimeout(() => {
      setSuccess(false)
      onClose()
    }, 1200)
  }

  const inputCls = 'w-full h-[48px] rounded-xl px-4 text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-primary caret-accent-primary bg-transparent'

  return (
    <Drawer open={open} onClose={onClose} title="Edit Profile">
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-text-tertiary" style={{ fontSize: 13 }}>Loading…</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)() }}
          className="flex flex-col gap-5 px-6 py-5"
        >
          {/* Display Name */}
          <Field id="ep-firstName" label="Display Name" error={errors.firstName?.message}>
            <input
              id="ep-firstName"
              type="text"
              placeholder="Your display name"
              className={inputCls}
              style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
              {...register('firstName')}
            />
          </Field>

          {/* Username */}
          <Field id="ep-username" label="Username" error={errors.username?.message}>
            <div className="relative">
              <input
                id="ep-username"
                type="text"
                placeholder="username"
                autoComplete="username"
                className={cn(inputCls, 'pr-10')}
                style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
                {...register('username', { onChange: (e) => checkUsername(e.target.value) })}
              />
              {username.length >= 3 && username !== originalUsername && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs">
                  {checkingUsername ? '…'
                    : usernameAvailable === true ? <span className="text-green-400">✓</span>
                    : usernameAvailable === false ? <span className="text-text-error">✗ taken</span>
                    : null}
                </span>
              )}
            </div>
          </Field>

          {/* Date of Birth */}
          <Field label="Date of Birth" error={errors.dobDd?.message ?? errors.dobMm?.message ?? errors.dobYyyy?.message}>
            <div className="flex gap-2">
              {[
                { name: 'dobDd' as const, placeholder: 'DD', max: 2, w: 'w-16' },
                { name: 'dobMm' as const, placeholder: 'MM', max: 2, w: 'w-16' },
                { name: 'dobYyyy' as const, placeholder: 'YYYY', max: 4, w: 'w-[88px]' },
              ].map(({ name, placeholder, max, w }) => (
                <input
                  key={name}
                  placeholder={placeholder}
                  inputMode="numeric"
                  maxLength={max}
                  aria-label={placeholder}
                  className={cn(w, 'h-[48px] rounded-xl text-center text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-primary')}
                  style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
                  {...register(name)}
                />
              ))}
            </div>
          </Field>

          {/* Gender */}
          <Field label="Gender" error={errors.gender?.message}>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <Chip key={g} label={g} selected={gender === g} onClick={() => setValue('gender', g)} />
              ))}
            </div>
          </Field>

          {/* Career Domain */}
          <Field label="Career Domain">
            <DomainSelect value={domain} onChange={(v) => setValue('domain', v)} error={errors.domain?.message} />
          </Field>

          {/* Current Status */}
          <Field label="Current Status" error={errors.status?.message}>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Chip key={s} label={s} selected={status === s} onClick={() => setValue('status', s)} />
              ))}
            </div>
          </Field>

          {/* Locked email notice */}
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-text-tertiary" style={{ fontSize: 11 }}>
              Email address cannot be changed. Contact support if needed.
            </p>
          </div>

          {serverError && <p className="text-center text-sm text-text-error">{serverError}</p>}
          {success && <p className="text-center text-sm" style={{ color: '#22c55e' }}>Saved successfully.</p>}

          <div className="flex justify-center pt-1 pb-2">
            <Button
              variant="primary"
              className="w-[180px] h-[46px]"
              onClick={handleSubmit(onSubmit)}
              disabled={saving || usernameAvailable === false}
              aria-busy={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}
    </Drawer>
  )
}
