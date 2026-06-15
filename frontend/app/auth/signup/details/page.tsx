'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signupStep2Schema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useDebouncedCallback } from 'use-debounce'

type FormData = z.infer<typeof signupStep2Schema>

const GENDERS = ['Male', 'Female', 'Not Listed'] as const

export default function SignupStep2Page() {
  const router = useRouter()
  const { draft, setDob, setUsername, setGender } = useSignupStore()

  // Guard: User must have an email draft to be here (from either OTP or password signup).
  useEffect(() => {
    if (!draft.email) {
      router.replace('/auth')
    }
  }, [draft.email, router])
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signupStep2Schema),
    defaultValues: {
      dob: draft.dob,
      username: draft.username,
      gender: draft.gender,
    },
  })

  const gender = watch('gender')
  const username = watch('username', '')

  const checkUsername = useDebouncedCallback(async (value: string) => {
    if (value.length < 3) { setUsernameAvailable(null); return }
    setCheckingUsername(true)
    try {
      const res = await fetch(`/api/auth/username?q=${encodeURIComponent(value)}`)
      const json = await res.json() as { available: boolean }
      setUsernameAvailable(json.available)
    } finally {
      setCheckingUsername(false)
    }
  }, 400)

  function onSubmit(data: FormData) {
    // Hard block: username must be verified available before proceeding
    if (usernameAvailable === false) return
    if (usernameAvailable === null && data.username.length >= 3) {
      // Username hasn't been checked yet — trigger check and block
      checkUsername(data.username)
      return
    }
    setDob(data.dob)
    setUsername(data.username)
    setGender(data.gender)
    router.push('/auth/signup/career')
  }

  return (
    <div
      className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[340px] lg:max-w-[420px] p-4 lg:p-8 flex flex-col"
    >
      {/* Date of Birth */}
      <label className="block text-text-primary mb-3" style={{ fontSize: '18px', fontWeight: 500 }}>
        Date of Birth
      </label>
      <div className="flex gap-3">
        {(['dd', 'mm', 'yyyy'] as const).map((field) => (
          <input
            key={field}
            placeholder={field.toUpperCase()}
            inputMode="numeric"
            maxLength={field === 'yyyy' ? 4 : 2}
            className={cn(
              'h-[56px] rounded-xl text-center text-body text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-primary',
              field === 'yyyy' ? 'w-[90px]' : 'w-20',
            )}
            style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
            aria-label={field === 'dd' ? 'Day' : field === 'mm' ? 'Month' : 'Year'}
            {...register(`dob.${field}`)}
          />
        ))}
      </div>
      {errors.dob && (
        <p className="mt-1.5 text-caption text-text-error">
          {errors.dob.dd?.message ?? errors.dob.mm?.message ?? errors.dob.yyyy?.message}
        </p>
      )}

      {/* Username */}
      <label
        htmlFor="username"
        className="block text-text-primary mt-6 mb-3"
        style={{ fontSize: '18px', fontWeight: 500 }}
      >
        Username
      </label>
      <div className="relative">
        <input
          id="username"
          type="text"
          placeholder="Enter your username"
          autoComplete="username"
          aria-describedby="username-hint"
          className="w-full h-[56px] rounded-xl px-6 text-body text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-primary caret-accent-primary"
          style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
          {...register('username', {
            onChange: (e) => checkUsername(e.target.value),
          })}
        />
        {username.length >= 3 && (
          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-caption">
            {checkingUsername
              ? '…'
              : usernameAvailable === true
              ? <span className="text-green-400">✓</span>
              : usernameAvailable === false
              ? <span className="text-text-error">✗ taken</span>
              : null}
          </span>
        )}
      </div>
      {errors.username && (
        <p id="username-hint" className="mt-1.5 text-caption text-text-error">
          {errors.username.message}
        </p>
      )}

      {/* Gender */}
      <fieldset className="mt-6">
        <legend
          className="text-text-primary mb-3"
          style={{ fontSize: '18px', fontWeight: 500 }}
        >
          Gender
        </legend>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Gender">
          {GENDERS.map((g) => (
            <Chip
              key={g}
              label={g}
              selected={gender === g}
              onClick={() => setValue('gender', g)}
              aria-checked={gender === g}
            />
          ))}
        </div>
        {errors.gender && (
          <p className="mt-1.5 text-caption text-text-error">
            {errors.gender.message}
          </p>
        )}
      </fieldset>

      {/* Continue */}
      <div className="flex justify-center mt-8">
        <Button
          variant="primary"
          className="w-[200px] h-[56px] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
          onClick={handleSubmit(onSubmit)}
          disabled={usernameAvailable === false || checkingUsername}
        >
          {checkingUsername ? 'Checking…' : 'Continue'}
        </Button>
      </div>

      {/* Privacy link */}
      <div className="mt-6 text-center">
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded"
        >
          Read User Privacy Policies
        </a>
      </div>
    </div>
  )
}
