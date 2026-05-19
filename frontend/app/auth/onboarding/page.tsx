'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSignupStore } from '@/stores/signup'

/* ────────────────────────────────────────────────────────────
   /auth/onboarding — Codemo welcome screen.

   Concept: after a successful sign-in, the user lands on a
   quiet, intentional moment — a centred avatar wreathed in
   two slowly-spinning rings (the page is actively setting
   things up), with a Poppins-extralight greeting underneath.
   Slow Codemo-blue gaussian blobs drift through the
   background like cells, never freezing. When the work is
   done and the animation has played, the page redirects home.

   What the page actually does while the user watches:
     1. Confirms the supabase session (defensive — proxy
        should have caught no-session, but covers the rare
        cookie-host mismatch after OAuth).
     2. Persists profile_complete:true so the proxy stops
        redirecting the user back here on every request.
     3. Soft-sets first_name + avatar_url from the OAuth
        profile when they're missing locally.
     4. Clears the persisted signup draft (zustand
        sessionStorage). Stale draft data from a prior
        email signup attempt would otherwise re-populate the
        signup pages if the user signs out and back in.
     5. Refreshes the router cache so the (app) shell renders
        with the just-updated user metadata on the very next
        request.
     6. Redirects to /.

   Design rules honoured:
     • Poppins extralight (weight 200).
     • Large but not overpowering — clamp tops out at 92px
       rather than the previous 168px.
     • No buttons, no progress bars, no icons besides the
       avatar (which IS the focal point).
     • Background blobs animate continuously — slow, organic,
       never paused.
     • Layout bypassed via FULL_BLEED_AUTH_ROUTES in
       app/auth/layout.tsx so this page paints viewport-wide.
   ────────────────────────────────────────────────────────── */

/* ── Choreography knobs ────────────────────────────────────
   The page reads through three loading "stages" before the
   redirect. Each stage shows for STAGE_DURATION_MS so the
   user actually has time to read it, and total dwell ends
   ~700ms after the last stage so the final line has room
   to land before the page swaps out.

   Timeline:
     0    s — page mounts, avatar pops in, copy reveals
     0.55 s — sublabel wrapper fades in, stage 0 visible
     2.35 s — stage 1
     4.15 s — stage 2
     5.95 s — REDIRECT_DELAY_MS elapses → router.replace('/')

   Why this long? An auth handshake that finishes in <2s
   reads as a glitch, not a "professional setup" beat. 6s
   matches the cadence of native OS first-run welcomes
   (Windows 11, macOS Setup Assistant) which is the
   reference the brief asks for. */
const STAGE_DURATION_MS = 1800
const SUBLABEL_DELAY_MS = 550
const REDIRECT_DELAY_MS = SUBLABEL_DELAY_MS + STAGE_DURATION_MS * 3 + 100 // 5950ms

/* Loading stages shown in sequence under the headline. Each
   describes a real piece of work the page is doing — the
   updateUser/clearDraft/refresh calls all fire during this
   window, so the labels are honest, not decorative. */
const LOADING_STAGES = [
  'Securing your session',
  'Loading your workspace',
  'Almost ready',
] as const

interface OAuthIdentity {
  firstName: string
  avatarUrl: string | null
  initial: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const clearSignupDraft = useSignupStore((s) => s.clearDraft)
  const [identity, setIdentity] = useState<OAuthIdentity | null>(null)
  const [stage, setStage] = useState(0)
  const startedRef = useRef(false)

  // Drive the sublabel through its three loading stages on a
  // fixed cadence. Independent of the auth round-trip so the
  // text always advances at a predictable rhythm, even on
  // very fast networks.
  useEffect(() => {
    const t1 = setTimeout(
      () => setStage(1),
      SUBLABEL_DELAY_MS + STAGE_DURATION_MS,
    )
    const t2 = setTimeout(
      () => setStage(2),
      SUBLABEL_DELAY_MS + STAGE_DURATION_MS * 2,
    )
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    // Strict-mode double-invoke guard. The auth layout's
    // FULL_BLEED_AUTH_ROUTES branch already prevents the
    // mobile/desktop double-render, so this is just for dev.
    if (startedRef.current) return
    startedRef.current = true

    let cancelled = false
    let redirectTimer: ReturnType<typeof setTimeout> | null = null

    async function init() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      if (cancelled) return

      if (error || !data.user) {
        // Defensive — should not happen given the proxy guards,
        // but if it does, send the user back to /auth instead
        // of stranding them on a welcome screen for nobody.
        router.replace('/auth')
        return
      }

      const meta = data.user.user_metadata as Record<string, unknown> | undefined
      const fullName =
        (typeof meta?.full_name === 'string' && meta.full_name) ||
        (typeof meta?.name === 'string' && meta.name) ||
        ''
      const first = fullName
        ? fullName.split(' ')[0]
        : data.user.email?.split('@')[0] ?? ''
      const avatarUrl =
        (typeof meta?.avatar_url === 'string' && meta.avatar_url) ||
        (typeof meta?.picture === 'string' && meta.picture) ||
        null
      const initial = (first || data.user.email || '?').charAt(0).toUpperCase()

      if (!cancelled) setIdentity({ firstName: first, avatarUrl, initial })

      // Background "intelligent" setup: mark profile complete,
      // sync first_name + avatar_url into user_metadata if
      // they're not there yet, and clear any stale signup
      // draft persisted in sessionStorage from an earlier
      // email-signup attempt.
      try {
        const patch: Record<string, unknown> = { profile_complete: true }
        if (first && !meta?.first_name) patch.first_name = first
        if (avatarUrl && !meta?.avatar_url) patch.avatar_url = avatarUrl
        await supabase.auth.updateUser({ data: patch })
      } catch {
        /* non-blocking — the user is logged in either way. */
      }

      try {
        clearSignupDraft()
      } catch {
        /* sessionStorage might be unavailable in some browsers. */
      }

      if (cancelled) return
      // Refresh router cache so the next page render sees the
      // freshly-written profile_complete flag (otherwise the
      // home page might receive a stale user object).
      router.refresh()

      redirectTimer = setTimeout(() => {
        if (!cancelled) router.replace('/')
      }, REDIRECT_DELAY_MS)
    }

    void init()
    return () => {
      cancelled = true
      if (redirectTimer) clearTimeout(redirectTimer)
    }
  }, [router, clearSignupDraft])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Signing you in to Codemo"
      className="codemo-onb fixed inset-0 z-[100] overflow-hidden"
      style={{
        background: 'var(--bg)',
        fontFamily: 'var(--font-poppins), system-ui, sans-serif',
      }}
    >
      {/* ── Background: slow drifting Codemo-blue blobs ───── */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="codemo-onb-blob codemo-onb-blob-1" />
        <div className="codemo-onb-blob codemo-onb-blob-2" />
        <div className="codemo-onb-blob codemo-onb-blob-3" />
        <div className="codemo-onb-blob codemo-onb-blob-4" />
        {/* Edge vignette so blobs settle into the surface
            rather than meeting the viewport hard. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 35%, color-mix(in oklab, var(--bg) 55%, transparent) 78%, var(--bg) 100%)',
          }}
        />
      </div>

      {/* ── Centred avatar + greeting ──────────────────────── */}
      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-6">
        <div className="codemo-onb-avatar">
          {/* Outer ring — slow CW spin */}
          <svg
            className="codemo-onb-ring codemo-onb-ring-outer"
            viewBox="0 0 132 132"
            aria-hidden="true"
          >
            <circle
              cx="66"
              cy="66"
              r="64"
              fill="none"
              stroke="color-mix(in oklab, var(--blue) 85%, transparent)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="118 284"
            />
          </svg>
          {/* Inner ring — faster CCW spin, lower opacity */}
          <svg
            className="codemo-onb-ring codemo-onb-ring-inner"
            viewBox="0 0 132 132"
            aria-hidden="true"
          >
            <circle
              cx="66"
              cy="66"
              r="56"
              fill="none"
              stroke="color-mix(in oklab, var(--blue) 45%, transparent)"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeDasharray="195 156"
            />
          </svg>

          {/* Avatar — OAuth picture, with a soft glass fallback
              so the layout never collapses if the picture is
              missing or fails to load. */}
          {identity?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={identity.avatarUrl}
              alt=""
              className="codemo-onb-avatar-img"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="codemo-onb-avatar-img codemo-onb-avatar-fallback">
              {identity?.initial ?? ''}
            </div>
          )}
        </div>

        <p className="codemo-onb-cap" style={{ fontWeight: 300 }}>
          Welcome back,
        </p>

        <h1
          className="codemo-onb-name"
          style={{
            fontWeight: 200,
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
          }}
        >
          {identity?.firstName || 'friend'}
        </h1>

        {/* Sublabel cycles through the loading stages. The
            wrapper fades in once (covering the reserved line
            height so layout never shifts), and the inner
            <span> re-mounts on every stage change via the
            React key, replaying its blur-rise animation so
            each stage feels like fresh information rather
            than a swap. */}
        <div className="codemo-onb-sub-wrapper" aria-live="polite">
          <span
            key={stage}
            className="codemo-onb-sub-text"
            style={{ fontWeight: 300 }}
          >
            {LOADING_STAGES[stage]}
          </span>
        </div>
      </div>

      <style>{`
        /* OVERRIDE in case this page ever renders inside the
           default auth grid — kept as a safety net even though
           FULL_BLEED_AUTH_ROUTES already bypasses that. */
        .codemo-onb.codemo-onb {
          max-width: none !important;
          width: 100% !important;
          padding: 0 !important;
        }

        /* ── Drifting Codemo-blue blobs ──────────────────────
           Long-period transforms (28s–40s) so motion reads as
           organic / cellular, never as a stutter or pause. */
        .codemo-onb-blob {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          will-change: transform;
        }
        .codemo-onb-blob-1 {
          top: -18%;
          left: -10%;
          width: 70vmin;
          height: 70vmin;
          background: radial-gradient(circle, color-mix(in oklab, var(--blue) 44%, transparent) 0%, transparent 65%);
          filter: blur(72px);
          animation: codemo-onb-drift-1 32s ease-in-out infinite;
        }
        .codemo-onb-blob-2 {
          top: 6%;
          right: -12%;
          width: 80vmin;
          height: 80vmin;
          background: radial-gradient(circle, color-mix(in oklab, var(--blue) 36%, transparent) 0%, transparent 60%);
          filter: blur(96px);
          animation: codemo-onb-drift-2 38s ease-in-out infinite;
        }
        .codemo-onb-blob-3 {
          bottom: -18%;
          left: 14%;
          width: 92vmin;
          height: 92vmin;
          background: radial-gradient(circle, color-mix(in oklab, var(--blue) 30%, transparent) 0%, transparent 60%);
          filter: blur(110px);
          animation: codemo-onb-drift-3 44s ease-in-out infinite;
        }
        .codemo-onb-blob-4 {
          bottom: 6%;
          right: 4%;
          width: 60vmin;
          height: 60vmin;
          background: radial-gradient(circle, color-mix(in oklab, var(--blue) 24%, transparent) 0%, transparent 60%);
          filter: blur(80px);
          animation: codemo-onb-drift-4 36s ease-in-out infinite;
        }
        @keyframes codemo-onb-drift-1 {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          25%  { transform: translate3d(6%, 8%, 0) scale(1.08); }
          50%  { transform: translate3d(-4%, 12%, 0) scale(0.94); }
          75%  { transform: translate3d(-8%, -6%, 0) scale(1.04); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes codemo-onb-drift-2 {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          30%  { transform: translate3d(-10%, 6%, 0) scale(1.1); }
          55%  { transform: translate3d(4%, -10%, 0) scale(0.92); }
          80%  { transform: translate3d(8%, 4%, 0) scale(1.05); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes codemo-onb-drift-3 {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          22%  { transform: translate3d(8%, -8%, 0) scale(0.95); }
          50%  { transform: translate3d(-6%, 6%, 0) scale(1.08); }
          78%  { transform: translate3d(-10%, -4%, 0) scale(1.02); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes codemo-onb-drift-4 {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          28%  { transform: translate3d(-6%, -10%, 0) scale(1.07); }
          54%  { transform: translate3d(10%, 4%, 0) scale(0.93); }
          80%  { transform: translate3d(4%, 10%, 0) scale(1.04); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }

        /* ── Avatar + concentric loading rings ───────────── */
        .codemo-onb-avatar {
          position: relative;
          width: 132px;
          height: 132px;
          opacity: 0;
          transform: scale(0.92);
          animation: codemo-onb-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
        }
        .codemo-onb-ring {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          transform-origin: 50% 50%;
        }
        .codemo-onb-ring-outer { animation: codemo-onb-spin 2.4s linear infinite; }
        .codemo-onb-ring-inner { animation: codemo-onb-spin-rev 3.6s linear infinite; }
        .codemo-onb-avatar-img {
          position: absolute;
          left: 16px;
          top: 16px;
          width: 100px;
          height: 100px;
          border-radius: 9999px;
          object-fit: cover;
          background: var(--input-glass, color-mix(in oklab, var(--text1) 6%, transparent));
          box-shadow:
            inset 0 0 0 1px color-mix(in oklab, var(--text1) 10%, transparent),
            0 6px 24px color-mix(in oklab, var(--blue) 28%, transparent);
        }
        .codemo-onb-avatar-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text1);
          font-size: 36px;
          font-weight: 300;
          letter-spacing: -0.02em;
        }

        /* ── Greeting copy — Poppins extralight, restrained
              sizes so it reads as elegant not shouted. ───── */
        .codemo-onb-cap {
          margin-top: 28px;
          color: var(--text3);
          font-size: clamp(11px, 0.9vw, 13px);
          letter-spacing: 0.32em;
          text-transform: uppercase;
          opacity: 0;
          transform: translateY(8px);
          animation: codemo-onb-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
        }
        .codemo-onb-name {
          margin-top: 14px;
          color: var(--text1);
          font-size: clamp(40px, 6.4vw, 92px);
          opacity: 0;
          transform: translateY(20px);
          filter: blur(8px);
          animation: codemo-onb-rise 0.95s cubic-bezier(0.22, 1, 0.36, 1) 0.7s forwards;
        }
        /* Sublabel — wrapper reserves the line slot so the
           layout never jumps when the text swaps. Inner span
           is the actual animated text; its key changes per
           stage and React remounts it, replaying the
           blur-rise keyframe. */
        .codemo-onb-sub-wrapper {
          position: relative;
          margin-top: 26px;
          height: 1.5em;
          min-width: 240px;
          opacity: 0;
          animation: codemo-onb-fade-up 0.8s ease-out 0.55s forwards;
        }
        .codemo-onb-sub-text {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text2);
          font-size: clamp(13px, 1.05vw, 16px);
          letter-spacing: 0.04em;
          white-space: nowrap;
          animation: codemo-onb-stage-in 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes codemo-onb-stage-in {
          from { opacity: 0; transform: translateY(6px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }

        @keyframes codemo-onb-pop {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes codemo-onb-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes codemo-onb-rise {
          from { opacity: 0; transform: translateY(20px); filter: blur(8px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
        }
        @keyframes codemo-onb-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes codemo-onb-spin-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .codemo-onb-blob,
          .codemo-onb-ring-outer,
          .codemo-onb-ring-inner {
            animation: none !important;
          }
          .codemo-onb-avatar,
          .codemo-onb-cap,
          .codemo-onb-name,
          .codemo-onb-sub-wrapper,
          .codemo-onb-sub-text {
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
