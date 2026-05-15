'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CodemoLogo } from '@/components/ui/CodemoLogo'
import { useSignupStore } from '@/stores/signup'

export default function SignupSuccessPage() {
  const router = useRouter()
  const clearDraft = useSignupStore((s) => s.clearDraft)

  useEffect(() => {
    clearDraft()
    const t = setTimeout(() => router.replace('/'), 3000)
    return () => clearTimeout(t)
  }, [clearDraft, router])

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden cursor-pointer"
      style={{ background: '#000' }}
      onClick={() => router.replace('/')}
      role="button"
      aria-label="Click to continue to home"
    >
      {/* Animated blobs */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          width: '700px',
          height: '700px',
          top: '50%',
          left: '50%',
          transform: 'translate(-60%, -55%)',
          background: 'radial-gradient(circle, rgba(45,127,249,0.55) 0%, rgba(100,60,255,0.30) 45%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(48px)',
          animation: 'blob-1 14s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          top: '50%',
          left: '50%',
          transform: 'translate(5%, -40%)',
          background: 'radial-gradient(circle, rgba(120,80,255,0.45) 0%, rgba(45,127,249,0.20) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(52px)',
          animation: 'blob-2 17s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          width: '500px',
          height: '500px',
          top: '50%',
          left: '50%',
          transform: 'translate(-30%, 10%)',
          background: 'radial-gradient(circle, rgba(45,200,249,0.40) 0%, rgba(26,72,254,0.18) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(44px)',
          animation: 'blob-3 19s ease-in-out infinite',
        }}
      />

      {/* Dark overlay to keep text readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.35)' }}
      />

      {/* Text */}
      <p
        className="relative z-10 text-center text-white px-6 select-none"
        style={{
          fontSize: 'clamp(32px, 6vw, 64px)',
          fontWeight: 300,
          letterSpacing: '2px',
          lineHeight: 1.2,
          animation: 'text-shimmer 3s ease-in-out infinite, fade-up 0.9s ease-out both',
        }}
      >
        Register Successful
      </p>

      <p
        className="relative z-10 mt-4 text-white/50 text-center select-none"
        style={{
          fontSize: 15,
          fontWeight: 400,
          animation: 'fade-up 0.9s ease-out 0.4s both',
        }}
      >
        Redirecting you in a moment…
      </p>

      {/* Footer logo */}
      <div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 opacity-60"
        style={{ animation: 'fade-up 1s ease-out 0.6s both' }}
      >
        <CodemoLogo width={180} />
      </div>
    </div>
  )
}
