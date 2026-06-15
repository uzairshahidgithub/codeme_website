'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignupStore } from '@/stores/signup'

/* ────────────────────────────────────────────────────────────
   /auth/signup/success — Registration confirmed.

   Design brief:
     • Same drifting Codemo-blue gaussian-blur blobs as the
       home-screen hero and /auth/onboarding.
     • Centred "Register Successful" in Poppins Extra-Light
       (weight 200), large, elegant.
     • Small muted subtext: "Redirecting…"
     • No avatar, no progress bar, no countdown, no buttons.
     • Full dark/light mode support via CSS variables.
     • Redirects after 3 seconds (2 s for prefers-reduced-motion).
   ────────────────────────────────────────────────────────── */

const REDIRECT_DELAY_MS = 3000
const REDIRECT_DELAY_REDUCED_MS = 2000

export default function SignupSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clearDraft = useSignupStore((s) => s.clearDraft)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    clearDraft()

    const redirectUrl = searchParams?.get('redirect') || '/'
    const isReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const delay = isReduced ? REDIRECT_DELAY_REDUCED_MS : REDIRECT_DELAY_MS

    const timer = setTimeout(() => router.replace(redirectUrl), delay)
    return () => clearTimeout(timer)
  }, [clearDraft, router, searchParams])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Registration successful — redirecting"
      className="reg-success fixed inset-0 z-[100] overflow-hidden"
      style={{
        background: 'var(--bg)',
        fontFamily: 'var(--font-poppins), system-ui, sans-serif',
      }}
    >
      {/* ── Background: drifting Codemo-blue gaussian blobs ── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="reg-blob reg-blob-1" />
        <div className="reg-blob reg-blob-2" />
        <div className="reg-blob reg-blob-3" />
        <div className="reg-blob reg-blob-4" />
        {/* Edge vignette so blobs settle into the surface */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 35%, color-mix(in oklab, var(--bg) 55%, transparent) 78%, var(--bg) 100%)',
          }}
        />
      </div>

      {/* ── Centred text ────────────────────────────────────── */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-6">
        <h1
          className="reg-headline"
          style={{
            fontWeight: 200,
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
          }}
        >
          Register Successful
        </h1>

        <p
          className="reg-sub"
          style={{ fontWeight: 300 }}
        >
          Redirecting…
        </p>
      </div>

      <style>{`
        /* ── Safety override: full viewport even if nested ─── */
        .reg-success.reg-success {
          max-width: none !important;
          width: 100% !important;
          padding: 0 !important;
        }

        /* ── Drifting gaussian blobs ──────────────────────────
           Same animation language as /auth/onboarding and the
           homepage BlueHaze. Long-period transforms (28s–44s)
           so motion reads as organic, never stuttery. */
        .reg-blob {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          will-change: transform;
        }
        .reg-blob-1 {
          top: -18%;
          left: -10%;
          width: 70vmin;
          height: 70vmin;
          background: radial-gradient(circle, color-mix(in oklab, var(--blue) 44%, transparent) 0%, transparent 65%);
          filter: blur(72px);
          animation: reg-drift-1 32s ease-in-out infinite;
        }
        .reg-blob-2 {
          top: 6%;
          right: -12%;
          width: 80vmin;
          height: 80vmin;
          background: radial-gradient(circle, color-mix(in oklab, var(--blue) 36%, transparent) 0%, transparent 60%);
          filter: blur(96px);
          animation: reg-drift-2 38s ease-in-out infinite;
        }
        .reg-blob-3 {
          bottom: -18%;
          left: 14%;
          width: 92vmin;
          height: 92vmin;
          background: radial-gradient(circle, color-mix(in oklab, var(--blue) 30%, transparent) 0%, transparent 60%);
          filter: blur(110px);
          animation: reg-drift-3 44s ease-in-out infinite;
        }
        .reg-blob-4 {
          bottom: 6%;
          right: 4%;
          width: 60vmin;
          height: 60vmin;
          background: radial-gradient(circle, color-mix(in oklab, var(--blue) 24%, transparent) 0%, transparent 60%);
          filter: blur(80px);
          animation: reg-drift-4 36s ease-in-out infinite;
        }

        @keyframes reg-drift-1 {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          25%  { transform: translate3d(6%, 8%, 0) scale(1.08); }
          50%  { transform: translate3d(-4%, 12%, 0) scale(0.94); }
          75%  { transform: translate3d(-8%, -6%, 0) scale(1.04); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes reg-drift-2 {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          30%  { transform: translate3d(-10%, 6%, 0) scale(1.1); }
          55%  { transform: translate3d(4%, -10%, 0) scale(0.92); }
          80%  { transform: translate3d(8%, 4%, 0) scale(1.05); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes reg-drift-3 {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          22%  { transform: translate3d(8%, -8%, 0) scale(0.95); }
          50%  { transform: translate3d(-6%, 6%, 0) scale(1.08); }
          78%  { transform: translate3d(-10%, -4%, 0) scale(1.02); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes reg-drift-4 {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          28%  { transform: translate3d(-6%, -10%, 0) scale(1.07); }
          54%  { transform: translate3d(10%, 4%, 0) scale(0.93); }
          80%  { transform: translate3d(4%, 10%, 0) scale(1.04); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }

        /* ── Headline: Poppins Extra-Light (200), large ─────── */
        .reg-headline {
          color: var(--text1);
          font-family: var(--font-poppins), system-ui, sans-serif;
          font-weight: 200;
          font-size: clamp(28px, 6vw, 80px);
          max-width: 90vw;
          word-break: keep-all;
          opacity: 0;
          transform: translateY(24px);
          filter: blur(10px);
          animation: reg-rise 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
        }

        /* ── Subtext: muted, small ──────────────────────────── */
        .reg-sub {
          margin-top: 20px;
          color: var(--text3);
          font-family: var(--font-poppins), system-ui, sans-serif;
          font-weight: 300;
          font-size: clamp(12px, 1.1vw, 16px);
          letter-spacing: 0.06em;
          opacity: 0;
          transform: translateY(10px);
          animation: reg-fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.7s forwards;
        }

        /* ── Mobile: tighten for small viewports ────────────── */
        @media (max-width: 480px) {
          .reg-headline {
            font-size: 28px;
            letter-spacing: -0.02em;
            line-height: 1.15;
          }
          .reg-sub {
            margin-top: 14px;
            font-size: 13px;
          }
          .reg-blob-1 { width: 55vmin; height: 55vmin; filter: blur(56px); }
          .reg-blob-2 { width: 65vmin; height: 65vmin; filter: blur(72px); }
          .reg-blob-3 { width: 70vmin; height: 70vmin; filter: blur(80px); }
          .reg-blob-4 { width: 48vmin; height: 48vmin; filter: blur(60px); }
        }

        @keyframes reg-rise {
          from { opacity: 0; transform: translateY(24px); filter: blur(10px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes reg-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Accessibility: reduced motion ─────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .reg-blob {
            animation: none !important;
          }
          .reg-headline,
          .reg-sub {
            animation: none !important;
            opacity: 1;
            transform: none;
            filter: none;
          }
        }
      `}</style>
    </div>
  )
}
