'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSignupStore } from '@/stores/signup'
import { Button } from '@/components/ui/Button'

export default function SignupVerifyPage() {
  const email = useSignupStore((s) => s.draft.email)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [cooldown, setCooldown] = useState(0)

  async function handleResend() {
    setResendState('sending')
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setResendState('error')
      return
    }
    setResendState('sent')
    setCooldown(60)
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); setResendState('idle'); return 0 }
        return c - 1
      })
    }, 1000)
  }

  return (
    <div className="glass-card rounded-[22px] w-[calc(100%-64px)] lg:w-full max-w-[340px] lg:max-w-[420px] p-4 lg:p-8 flex flex-col items-center text-center">

      {/* Envelope icon */}
      <div
        className="flex items-center justify-center rounded-full mb-6"
        style={{
          width: 72, height: 72,
          background: 'rgba(26,72,254,0.12)',
          border: '1.5px solid rgba(26,72,254,0.25)',
          boxShadow: '0 0 32px rgba(26,72,254,0.18)',
        }}
        aria-hidden="true"
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="var(--blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </div>

      <h2 className="text-text-primary" style={{ fontSize: 22, fontWeight: 600 }}>
        Check your inbox
      </h2>
      <p className="text-text-tertiary mt-3 leading-relaxed" style={{ fontSize: 14 }}>
        We sent a confirmation link to{' '}
        <span className="text-text-primary font-medium">{email || 'your email'}</span>.
        Click the link to activate your account.
      </p>

      <p className="text-text-muted mt-4" style={{ fontSize: 13 }}>
        No email? Check your spam folder or resend below.
      </p>

      <div className="mt-6 w-full">
        {resendState === 'sent' ? (
          <p className="text-center text-sm" style={{ color: 'var(--blue)' }}>
            Email resent — check your inbox ✓
            {cooldown > 0 && <span className="text-text-muted ml-2">({cooldown}s)</span>}
          </p>
        ) : resendState === 'error' ? (
          <p className="text-center text-sm text-text-error">Failed to resend. Try again.</p>
        ) : (
          <Button
            variant="secondary"
            className="w-full h-[48px]"
            onClick={handleResend}
            disabled={resendState === 'sending' || cooldown > 0}
            aria-busy={resendState === 'sending'}
          >
            {resendState === 'sending' ? 'Sending…' : 'Resend confirmation email'}
          </Button>
        )}
      </div>

      <p className="mt-5 text-text-muted" style={{ fontSize: 12 }}>
        Wrong email?{' '}
        <a href="/auth/signup" className="text-text-link hover:underline">
          Go back and change it
        </a>
      </p>
    </div>
  )
}
