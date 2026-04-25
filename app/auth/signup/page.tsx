'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signupStep1Schema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'

type FormData = z.infer<typeof signupStep1Schema>

function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = [
    { label: '12+ chars', ok: password.length >= 12 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length

  const colours = ['#FF5C5C', '#FF5C5C', '#FFA500', '#FFA500', '#2D7FF9', '#22c55e']

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colours[score] : '#3A3A3A' }}
          />
        ))}
      </div>
      <p className="text-caption text-text-muted">
        {score < 3 ? 'Weak' : score < 5 ? 'Fair' : 'Strong'} password
      </p>
    </div>
  )
}

export default function SignupStep1Page() {
  const router = useRouter()
  const { draft, setPassword, setEmail } = useSignupStore()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(signupStep1Schema),
    defaultValues: { email: draft.email, password: draft.password },
  })

  const password = watch('password', '')

  function onSubmit(data: FormData) {
    setEmail(data.email)
    setPassword(data.password)
    router.push('/auth/signup/details')
  }

  return (
    <>
      <div
        className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8 flex flex-col"
      >
        {/* Email */}
        <Input
          id="email"
          type="email"
          placeholder="Enter Email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div className="mt-4">
          <PasswordInput
            id="password"
            placeholder="Enter Password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrengthMeter password={password} />
        </div>

        {/* Continue button */}
        <div className="flex justify-center mt-7">
          <Button
            variant="primary"
            className="w-[200px] h-[56px] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            onClick={handleSubmit(onSubmit)}
          >
            Continue
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
    </>
  )
}
