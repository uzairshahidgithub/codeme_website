'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { CodemoLogo } from '@/components/ui/CodemoLogo'

export default function AdminMfaVerifyPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      const supabase = createClient()
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors()
      if (cancelled) return
      const verified = (factors?.totp ?? []).find((f) => f.status === 'verified')
      if (listErr || !verified) {
        router.replace('/admin/auth/mfa-setup')
        return
      }
      setFactorId(verified.id)
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: verified.id })
      if (cancelled) return
      if (chErr || !challenge) {
        setError('Failed to issue challenge.')
        return
      }
      setChallengeId(challenge.id)
      inputRef.current?.focus()
    }
    void bootstrap()
    return () => { cancelled = true }
  }, [router])

  async function verify(submitCode: string) {
    if (!factorId || !challengeId || submitCode.length !== 6 || verifying) return
    setVerifying(true)
    setError(null)
    const supabase = createClient()
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: submitCode,
    })
    if (verifyErr) {
      setVerifying(false)
      setError('Code incorrect. Try again.')
      setCode('')
      return
    }
    router.refresh()
    router.replace('/admin')
  }

  function onChangeCode(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, 6)
    setCode(cleaned)
    if (cleaned.length === 6) void verify(cleaned)
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-[400px] flex flex-col gap-6"
        style={{ background: 'var(--card-glass)', border: '1px solid var(--border)', borderRadius: 22, padding: 40 }}
      >
        <div className="flex flex-col items-center gap-4">
          <CodemoLogo width={140} />
          <span className="px-3 py-1 rounded-full uppercase tracking-wider" style={{ background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>
            Admin · MFA
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-text-primary" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Verify your identity
          </h1>
          <p className="text-text-muted mt-1" style={{ fontSize: 13 }}>
            Enter the six-digit code from your authenticator app.
          </p>
        </div>

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
          />
          {error && <p className="text-center text-sm text-text-error">{error}</p>}
        </div>

        <Button
          variant="primary"
          className="w-full h-[48px]"
          disabled={code.length !== 6 || verifying}
          aria-busy={verifying}
          onClick={() => void verify(code)}
        >
          {verifying ? 'Verifying…' : 'Verify'}
        </Button>

        <p className="text-center text-text-tertiary" style={{ fontSize: 11 }}>
          Lost your authenticator? Contact a super_admin for recovery.
        </p>
      </div>
    </main>
  )
}
