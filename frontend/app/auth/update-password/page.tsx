'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { passwordSchema } from '@/lib/validations/auth'

const schema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type FormData = z.infer<typeof schema>

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    password.length >= 12,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const colours = ['#FF5C5C', '#FF5C5C', '#FFA500', '#FFA500', '#2D7FF9', '#22c55e']
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colours[score] : 'var(--border)' }} />
        ))}
      </div>
      <p className="text-caption text-text-muted">
        {score < 3 ? 'Weak' : score < 5 ? 'Fair' : 'Strong'} password
      </p>
    </div>
  )
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const newPassword = watch('newPassword', '')

  async function onSubmit(data: FormData) {
    setServerError('')
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    setSaving(false)
    if (error) { setServerError(error.message); return }
    setSuccess(true)
    setTimeout(() => router.replace('/'), 2500)
  }

  if (success) {
    return (
      <div className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8 flex flex-col items-center text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.25)' }}
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-text-primary" style={{ fontSize: 20, fontWeight: 600 }}>Password updated</h2>
        <p className="text-text-tertiary mt-2" style={{ fontSize: 14 }}>Redirecting you home…</p>
      </div>
    )
  }

  return (
    <div className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8 flex flex-col gap-5">
      <div>
        <h2 className="text-text-primary" style={{ fontSize: 20, fontWeight: 600 }}>Set New Password</h2>
        <p className="text-text-tertiary mt-1" style={{ fontSize: 13 }}>
          Choose a strong password to secure your account.
        </p>
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-text-secondary mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
          New Password
        </label>
        <PasswordInput
          id="newPassword"
          placeholder="New password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordStrengthMeter password={newPassword} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-text-secondary mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
          Confirm Password
        </label>
        <PasswordInput
          id="confirmPassword"
          placeholder="Confirm new password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </div>

      {serverError && <p className="text-sm text-text-error text-center">{serverError}</p>}

      <div className="flex justify-center">
        <Button
          variant="primary"
          className="w-[200px] h-[50px]"
          onClick={handleSubmit(onSubmit)}
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? 'Updating…' : 'Update Password'}
        </Button>
      </div>
    </div>
  )
}
