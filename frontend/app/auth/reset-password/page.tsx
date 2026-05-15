'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const schema = z.object({ email: z.string().email('Please enter a valid email address') })
type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setLoading(false)
    if (error) { setServerError(error.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8 flex flex-col items-center text-center">
        <div
          className="flex items-center justify-center rounded-full mb-5"
          style={{ width: 64, height: 64, background: 'rgba(26,72,254,0.12)', border: '1.5px solid rgba(26,72,254,0.25)' }}
          aria-hidden="true"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h2 className="text-text-primary" style={{ fontSize: 20, fontWeight: 600 }}>Check your inbox</h2>
        <p className="text-text-tertiary mt-3 leading-relaxed" style={{ fontSize: 14 }}>
          If an account exists for that email, we have sent a password reset link.
        </p>
        <div className="mt-6">
          <Link href="/auth/login" className="text-text-link hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8 flex flex-col gap-5">
      <div>
        <h2 className="text-text-primary" style={{ fontSize: 20, fontWeight: 600 }}>Reset Password</h2>
        <p className="text-text-tertiary mt-1" style={{ fontSize: 13 }}>
          Enter your account email and we will send you a reset link.
        </p>
      </div>

      <Input
        id="email"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        error={errors.email?.message ?? serverError}
        {...register('email')}
      />

      <div className="flex justify-center">
        <Button
          variant="primary"
          className="w-[200px] h-[50px]"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </div>

      <p className="text-center text-[12px] text-text-tertiary">
        Remember your password?{' '}
        <Link href="/auth/login" className="text-text-link hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  )
}
