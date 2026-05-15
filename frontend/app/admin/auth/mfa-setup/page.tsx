'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { CodemoLogo } from '@/components/ui/CodemoLogo'

interface FactorState {
  id: string
  qrCode: string
  secret: string
}

export default function AdminMfaSetupPage() {
  const router = useRouter()
  const [factor, setFactor] = useState<FactorState | null>(null)
  const [code, setCode] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function enrol() {
      const supabase = createClient()
      const { data, error: enrolErr } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (cancelled) return
      if (enrolErr || !data) {
        setError(enrolErr?.message ?? 'Failed to start MFA enrolment.')
        return
      }
      setFactor({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret })
    }
    void enrol()
    return () => { cancelled = true }
  }, [])

  async function verify() {
    if (!factor || code.length !== 6) return
    setEnrolling(true)
    setError(null)
    const supabase = createClient()
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: factor.id })
    if (challengeErr || !challenge) {
      setEnrolling(false)
      setError('Failed to issue challenge.')
      return
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challenge.id,
      code,
    })
    setEnrolling(false)
    if (verifyErr) {
      setError('Code incorrect. Try again.')
      return
    }
    router.refresh()
    router.replace('/admin')
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-[440px] flex flex-col gap-6"
        style={{ background: 'var(--card-glass)', border: '1px solid var(--border)', borderRadius: 22, padding: 40 }}
      >
        <div className="flex flex-col items-center gap-4">
          <CodemoLogo width={140} />
          <span className="px-3 py-1 rounded-full uppercase tracking-wider" style={{ background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em' }}>
            Admin · MFA setup
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-text-primary" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Set up two-factor authentication
          </h1>
          <p className="text-text-muted mt-1" style={{ fontSize: 13, lineHeight: 1.55 }}>
            Scan this QR code with an authenticator app, then enter the six-digit code to confirm.
          </p>
        </div>

        {factor ? (
          <>
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl p-3" style={{ background: '#fff' }}>
                <Image
                  src={factor.qrCode}
                  alt="TOTP QR code"
                  width={180}
                  height={180}
                  unoptimized
                  className="block"
                />
              </div>
              <code className="text-text-tertiary break-all text-center" style={{ fontSize: 11, padding: '6px 10px', background: 'var(--input-glass)', borderRadius: 8, border: '1px solid var(--border)' }}>
                {factor.secret}
              </code>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="totp" className="text-text-secondary" style={{ fontSize: 12, fontWeight: 500 }}>Six-digit code</label>
              <input
                id="totp"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full h-[48px] rounded-xl px-4 text-center text-text-primary outline-none focus:ring-2 focus:ring-accent-primary tracking-[0.3em]"
                style={{ background: 'var(--input-glass)', border: '1px solid var(--border)', fontSize: 18 }}
                placeholder="000000"
              />
            </div>

            {error && <p className="text-center text-sm text-text-error">{error}</p>}

            <Button variant="primary" className="w-full h-[48px]" disabled={code.length !== 6 || enrolling} onClick={verify} aria-busy={enrolling}>
              {enrolling ? 'Verifying…' : 'Confirm and continue'}
            </Button>
          </>
        ) : (
          <p className="text-center text-text-tertiary" style={{ fontSize: 13 }}>{error ?? 'Generating QR code…'}</p>
        )}
      </div>
    </main>
  )
}
