'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import ReCAPTCHA from 'react-google-recaptcha'
import { z } from 'zod'
import { useSignupStore } from '@/stores/signup'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof formSchema>

export default function LoginPage() {
  const router = useRouter()
  const email = useSignupStore((s) => s.draft.email)
  const recaptchaRef = useRef<ReCAPTCHA>(null)
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

    const token = recaptchaRef.current?.getValue() ?? ''
    if (!token) {
      setServerError('Please complete the reCAPTCHA')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      recaptchaToken: token,
      redirect: false,
    })

    recaptchaRef.current?.reset()

    if (result?.error) {
      setServerError('Email or password is incorrect')
      setLoading(false)
      return
    }

    router.replace('/')
  }

  return (
    <>
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

        {/* Login button */}
        <div className="flex justify-center mt-7">
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

        {/* Privacy Policy */}
        <div className="mt-6 text-center text-[12px] text-text-tertiary">
          By continuing, you agree to Codemo&apos;s <a href="#" className="underline hover:text-text-primary transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-text-primary transition-colors">Privacy Policy</a>.
        </div>
      </div>

      {/* reCAPTCHA */}
      <div
        className="auth-glass-card rounded-2xl flex items-center justify-center mt-4 lg:mt-8 w-[calc(100%-64px)] lg:w-full max-w-[320px] lg:max-w-[420px] h-[96px]"
      >
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
          theme="dark"
        />
      </div>
    </>
  )
}
