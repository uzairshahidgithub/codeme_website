'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ChevronDown, CircleAlert, Info, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Chip } from '@/components/ui/Chip'
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

/* Shared input styling — used for text + DOB inputs.

   IMPORTANT: backgrounds use explicit color-mix() rather
   than Tailwind's `bg-text-primary/[alpha]` syntax. The
   token (`--text1`) is a CSS variable, and Tailwind's
   relative-color-syntax compiler can fail on var()-based
   colors in some browsers — falling back to opaque white,
   which was painting the inputs as light boxes in dark
   mode. color-mix is supported everywhere our autoprefixer
   targets and gives a deterministic rgba result.

   `--text1` is white-ish in dark mode (#f0f0f0) and
   near-black in light mode (#0a0a0a), so the same recipe
   reads as a darker well on the dark card and as a lighter
   well on the light card. */
const inputBase =
  'w-full h-11 rounded-[12px] px-3.5 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none transition-all border border-border-subtle hover:border-border-subtle/80 focus:border-[color:var(--blue)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--blue)_18%,transparent)] caret-accent-primary bg-[color:color-mix(in_oklab,var(--text1)_7%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--text1)_10%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--text1)_13%,transparent)]'

function DomainSelect({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value ?? '')
  const filtered = DOMAINS.filter((d) => d.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative">
      <div className="relative" onClick={() => setOpen(true)}>
        <input
          type="text"
          placeholder="Search domain…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={cn(inputBase, 'pr-10')}
          aria-label="Career domain"
        />
        <ChevronDown
          size={14}
          aria-hidden
          className={cn(
            'absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </div>
      {open && filtered.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1.5 z-50 rounded-[12px] overflow-hidden overflow-y-auto max-h-[200px] py-1 glass-card border border-border-subtle"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {filtered.map((d) => (
            <button
              key={d}
              type="button"
              className="w-full text-left px-3.5 py-2.5 text-[13px] text-text-primary hover:bg-[color:var(--blue)] hover:text-white transition-colors"
              onMouseDown={(e) => { e.preventDefault(); setQuery(d); onChange(d); setOpen(false) }}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="mt-1.5 text-[12px] text-text-error flex items-center gap-1.5">
          <CircleAlert size={12} aria-hidden /> {error}
        </p>
      )}
    </div>
  )
}

function Field({ id, label, children, error }: { id?: string; label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-text-secondary text-[12px] font-medium tracking-wide">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[12px] text-text-error flex items-center gap-1.5">
          <CircleAlert size={12} aria-hidden /> {error}
        </p>
      )}
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
  const [userId, setUserId] = useState('')

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
      setUserId(user.id)
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
      const res = await fetch(`/api/auth/username?q=${encodeURIComponent(val)}${userId ? `&uid=${userId}` : ''}`)
      const json = (await res.json()) as { available: boolean }
      setUsernameAvailable(json.available)
    } finally { setCheckingUsername(false) }
  }, 400)

  async function onSubmit(data: FormData) {
    if (usernameAvailable === false) return
    setServerError('')
    setSaving(true)
    const supabase = createClient()

    // 1. Update auth user_metadata
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
    if (error) { setSaving(false); setServerError(error.message); return }

    // 2. Sync profiles table (the UNIQUE constraint lives here)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: data.username,
        first_name: data.firstName,
        dob: `${data.dobYyyy}-${data.dobMm.padStart(2, '0')}-${data.dobDd.padStart(2, '0')}`,
        gender: data.gender,
        domain: data.domain,
        status: data.status,
      })
      .eq('id', userId)

    setSaving(false)
    if (profileError) {
      // Username constraint violation
      if (profileError.code === '23505') {
        setServerError('That username is already taken.')
        setUsernameAvailable(false)
        return
      }
      setServerError(profileError.message)
      return
    }

    setOriginalUsername(data.username)
    setSuccess(true)
    router.refresh()
    setTimeout(() => {
      setSuccess(false)
      onClose()
    }, 1200)
  }

  return (
    <Drawer open={open} onClose={onClose} title="Edit Profile">
      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2 text-text-tertiary text-[13px]">
          <Loader2 size={14} className="animate-spin" aria-hidden />
          Loading your profile…
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)() }}
          className="flex flex-col gap-5 px-6 py-6"
        >
          {/* Display Name */}
          <Field id="ep-firstName" label="Display Name" error={errors.firstName?.message}>
            <input
              id="ep-firstName"
              type="text"
              placeholder="Your display name"
              className={inputBase}
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
                className={cn(inputBase, 'pr-12')}
                {...register('username', { onChange: (e) => checkUsername(e.target.value) })}
              />
              {username.length >= 3 && username !== originalUsername && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[12px]">
                  {checkingUsername ? (
                    <Loader2 size={12} className="animate-spin text-text-tertiary" aria-hidden />
                  ) : usernameAvailable === true ? (
                    <span className="inline-flex items-center gap-1 text-[#22c55e] font-medium">
                      <Check size={13} aria-hidden /> free
                    </span>
                  ) : usernameAvailable === false ? (
                    <span className="text-text-error font-medium">taken</span>
                  ) : null}
                </span>
              )}
            </div>
          </Field>

          {/* Date of Birth */}
          <Field label="Date of Birth" error={errors.dobDd?.message ?? errors.dobMm?.message ?? errors.dobYyyy?.message}>
            <div className="flex gap-2">
              {[
                { name: 'dobDd' as const, placeholder: 'DD', max: 2, w: 'w-[64px]' },
                { name: 'dobMm' as const, placeholder: 'MM', max: 2, w: 'w-[64px]' },
                { name: 'dobYyyy' as const, placeholder: 'YYYY', max: 4, w: 'w-[88px]' },
              ].map(({ name, placeholder, max, w }) => (
                <input
                  key={name}
                  placeholder={placeholder}
                  inputMode="numeric"
                  maxLength={max}
                  aria-label={placeholder}
                  className={cn(inputBase, w, 'text-center tabular-nums')}
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
            className="rounded-[12px] px-3.5 py-3 flex items-center gap-2 border border-border-subtle bg-[color:color-mix(in_oklab,var(--text1)_6%,transparent)]"
          >
            <Info size={13} className="text-text-tertiary shrink-0" aria-hidden />
            <p className="text-text-tertiary text-[11.5px] leading-snug">
              Email address cannot be changed here. Contact support if you need to update it.
            </p>
          </div>

          {/* Server feedback */}
          {serverError && (
            <p className="rounded-[10px] px-3 py-2 text-[12.5px] text-text-error bg-[color:color-mix(in_oklab,#ff5c5c_10%,transparent)] border border-[color:color-mix(in_oklab,#ff5c5c_30%,transparent)]">
              {serverError}
            </p>
          )}
          {success && (
            <p className="rounded-[10px] px-3 py-2 text-[12.5px] text-[#22c55e] bg-[color:color-mix(in_oklab,#22c55e_10%,transparent)] border border-[color:color-mix(in_oklab,#22c55e_30%,transparent)] flex items-center gap-2">
              <Check size={14} aria-hidden /> Saved successfully.
            </p>
          )}

          {/* Sticky action bar */}
          <div className="flex items-center justify-end gap-2 pt-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-full text-[13.5px] font-medium text-text-secondary hover:text-text-primary hover:bg-text-primary/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || usernameAvailable === false}
              aria-busy={saving}
              className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-[13.5px] font-medium text-white transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              style={{
                background: 'var(--blue)',
                boxShadow: '0 8px 20px -10px color-mix(in oklab, var(--blue) 65%, transparent)',
              }}
            >
              {saving && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}
    </Drawer>
  )
}
