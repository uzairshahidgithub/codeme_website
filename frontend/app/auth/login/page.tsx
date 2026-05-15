'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useSignupStore } from '@/stores/signup'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter()
  const { draft, clearDraft } = useSignupStore()
  const email = draft.email
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email },
  })

  const password = watch('password', '')

  async function onSubmit(data: FormData) {
    setServerError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError('Email or password is incorrect')
      setLoading(false)
      return
    }

    clearDraft()
    router.replace('/')
    router.refresh()
  }

  return (
    <div
      className="auth-glass-card rounded-2xl w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] p-4 lg:p-8"
    >
      {/* Email */}
      <Input
        id="email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />

      {/* Password */}
      <div className="mt-4">
        <PasswordInput
          id="password"
          placeholder="Enter Password"
          autoComplete="current-password"
          error={errors.password?.message ?? serverError}
          {...register('password')}
        />
      </div>

      {/* Forgot password */}
      <div className="mt-3 text-right">
        <Link
          href="/auth/reset-password"
          className="text-[12px] text-text-tertiary hover:text-text-primary transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      {/* Login button */}
      <div className="flex justify-center mt-6">
        <Button
          variant="primary"
          className="w-[200px] h-[56px] shadow-[0_0_30px_rgba(59,130,246,0.2)]"
          onClick={handleSubmit(onSubmit)}
          disabled={loading || password.length < 8}
          aria-busy={loading}
        >
          {loading ? 'Logging in…' : 'Login'}
        </Button>
      </div>

      {/* Footer links */}
      <div className="mt-5 text-center text-[12px] text-text-tertiary space-y-2">
        <p>
          No account?{' '}
          <Link href="/auth/signup" className="text-text-link hover:underline">
            Sign up
          </Link>
        </p>
        <p>
          By continuing, you agree to Codemo&apos;s{' '}
          <a href="#" className="underline hover:text-text-primary transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-text-primary transition-colors">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}
