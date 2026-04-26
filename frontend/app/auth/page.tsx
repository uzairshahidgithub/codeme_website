'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { emailSchema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SocialButton } from '@/components/ui/SocialButton'

type FormData = z.infer<typeof emailSchema>

export default function AuthDefaultPage() {
  const router = useRouter()
  const setEmail = useSignupStore((s) => s.setEmail)
  const [checking, setChecking] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(emailSchema),
  })

  async function onContinue(data: FormData) {
    setChecking(true)
    setServerError('')
    setEmail(data.email)

    try {
      const res = await fetch('/api/auth/email-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      const json = await res.json() as { exists: boolean }
      router.push(json.exists ? '/auth/login' : '/auth/signup')
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  function onSignUp() {
    const email = getValues('email')
    if (email) setEmail(email)
    router.push('/auth/signup')
  }

  return (
    <>
      {/* Card */}
      <div
        className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8"
      >
        {/* Email input */}
        <Input
          id="email"
          type="email"
          placeholder="Enter Email"
          autoComplete="email"
          error={errors.email?.message ?? serverError}
          {...register('email')}
        />

        {/* Action buttons */}
        <div className="flex gap-3 mt-5">
          <Button
            variant="primary"
            className="flex-1 h-[56px] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            onClick={handleSubmit(onContinue)}
            disabled={checking}
            aria-busy={checking}
          >
            {checking ? 'Checking…' : 'Continue'}
          </Button>
          <Button variant="secondary" className="flex-1 h-[56px]" onClick={onSignUp}>
            Sign Up
          </Button>
        </div>

        {/* Divider */}
        <div className="mt-7 text-center">
          <span className="text-text-muted text-body-sm">or Continue via</span>
          <div className="mt-3 h-px bg-border-subtle" />
        </div>

        {/* Social providers */}
        <div className="flex justify-center gap-6 mt-5">
          <SocialButton
            provider="google"
            onClick={() => signIn('google', { callbackUrl: '/' })}
          />
          <SocialButton
            provider="apple"
            onClick={() => signIn('apple', { callbackUrl: '/' })}
          />
          <SocialButton
            provider="microsoft"
            onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
          />
        </div>

        {/* Privacy Policy */}
        <div className="mt-6 text-center text-[12px] text-text-tertiary">
          By continuing, you agree to Codemo&apos;s <a href="#" className="underline hover:text-text-primary transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-text-primary transition-colors">Privacy Policy</a>.
        </div>
      </div>
    </>
  )
}
