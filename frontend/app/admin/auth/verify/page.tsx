'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isAdminRole } from '@/lib/admin/roles'
import { Button } from '@/components/ui/Button'
import { CodemoLogo } from '@/components/ui/CodemoLogo'
import { getTurnstileErrorMessage, getTurnstileSiteKey } from '@/lib/utils'
import { Turnstile } from '@marsidev/react-turnstile'
import Link from 'next/link'
import { ADMIN_CREDS_OK_KEY, ADMIN_VERIFY_EMAIL_KEY, readAdminCredsGate } from '@/lib/admin/login-keys'
function AdminVerifyInner() {
  const router = useRouter()
  const params = useSearchParams()
  const emailFromQuery = params.get('email') ?? ''
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [sending, setSending] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const sentRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_VERIFY_EMAIL_KEY) ?? ''
    const resolved = emailFromQuery || stored
    if (!resolved || !readAdminCredsGate(resolved)) {
      router.replace('/admin/auth')
      return
    }
    setEmail(resolved)
    sessionStorage.setItem(ADMIN_VERIFY_EMAIL_KEY, resolved)
  }, [emailFromQuery, router])

  async function sendCode(token: string, targetEmail: string) {
    if (sentRef.current && codeSent) return
    setSending(true)
    setError(null)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        captchaToken: token,
        shouldCreateUser: false,
      },
    })

    setSending(false)
    if (otpError) {
      setError(otpError.message)
      setTurnstileToken(null)
      sentRef.current = false
      return
    }

    sentRef.current = true
    setCodeSent(true)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (!email || !turnstileToken || sentRef.current) return
    void sendCode(turnstileToken, email)
  }, [email, turnstileToken])

  async function verify(submitCode: string) {
    if (!email || submitCode.length !== 6 || verifying) return

    setVerifying(true)
    setError(null)

    const supabase = createClient()
    const { data: authData, error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token: submitCode,
      type: 'email',
    })

    if (verifyErr || !authData?.session || !authData.user) {
      setVerifying(false)
      setError(verifyErr?.message ?? 'Invalid or expired code. Request a new one.')
      setCode('')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (!profile || !isAdminRole(profile.role)) {
      await supabase.auth.signOut()
      sessionStorage.removeItem(ADMIN_VERIFY_EMAIL_KEY)
      sessionStorage.removeItem(ADMIN_CREDS_OK_KEY)
      setVerifying(false)
      setError('Access denied. This account does not have admin privileges.')
      return
    }

    sessionStorage.removeItem(ADMIN_VERIFY_EMAIL_KEY)
    sessionStorage.removeItem(ADMIN_CREDS_OK_KEY)
    router.refresh()
    router.replace('/admin')
  }

  function onChangeCode(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setCode(cleaned)
    if (cleaned.length === 6) void verify(cleaned)
  }

  async function resendCode() {
    if (!email || !turnstileToken || sending) return
    sentRef.current = false
    setCode('')
    await sendCode(turnstileToken, email)
  }

  if (!email) return null

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-[400px] flex flex-col gap-6"
        style={{ background: 'var(--card-glass)', border: '1px solid var(--border)', borderRadius: 22, padding: 40 }}
      >
        <div className="flex flex-col items-center gap-4">
          <CodemoLogo width={140} />
          <span
            className="px-3 py-1 rounded-full uppercase tracking-wider"
            style={{ background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}
          >
            Admin · Step 2
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-text-primary" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Enter verification code
          </h1>
          <p className="text-text-muted mt-2 leading-relaxed" style={{ fontSize: 14 }}>
            {codeSent ? (
              <>We sent a 6-digit code to <strong className="text-text-secondary">{email}</strong></>
            ) : (
              <>Complete the security check below to send a code to <strong className="text-text-secondary">{email}</strong></>
            )}
          </p>
        </div>

        {!codeSent && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={getTurnstileSiteKey()}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={(code) => setError(getTurnstileErrorMessage(String(code)))}
              onExpire={() => setTurnstileToken(null)}
              options={{ theme: 'dark' }}
            />
          </div>
        )}

        {sending && (
          <p className="text-center text-sm text-text-secondary">Sending verification code…</p>
        )}

        {codeSent && (
          <>
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => onChangeCode(e.target.value)}
                disabled={verifying}
                className="w-full h-[56px] rounded-xl px-4 text-center text-text-primary outline-none focus:ring-2 focus:ring-accent-primary tracking-[0.4em]"
                style={{ background: 'var(--input-glass)', border: '1px solid var(--border)', fontSize: 22 }}
                placeholder="000000"
                aria-label="Verification code"
              />
            </div>

            <Button
              variant="primary"
              className="w-full h-[48px]"
              disabled={code.length !== 6 || verifying}
              aria-busy={verifying}
              onClick={() => void verify(code)}
            >
              {verifying ? 'Verifying…' : 'Verify & sign in'}
            </Button>
          </>
        )}

        {error && <p className="text-center text-sm text-text-error">{error}</p>}

        {codeSent && (
          <div className="flex flex-col gap-3 items-center">
            <div className="flex justify-center">
              <Turnstile
                siteKey={getTurnstileSiteKey()}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={(code) => setError(getTurnstileErrorMessage(String(code)))}
                onExpire={() => setTurnstileToken(null)}
                options={{ theme: 'dark' }}
              />
            </div>
            <button
              type="button"
              onClick={() => void resendCode()}
              disabled={sending || !turnstileToken}
              className="text-text-link hover:underline disabled:opacity-50 text-sm"
            >
              {sending ? 'Sending…' : 'Resend code'}
            </button>
          </div>
        )}

        <p className="text-center text-text-tertiary" style={{ fontSize: 12 }}>
          <Link href="/admin/auth" className="text-text-link hover:underline">
            Back to admin login
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function AdminVerifyPage() {
  return (
    <Suspense fallback={null}>
      <AdminVerifyInner />
    </Suspense>
  )
}
