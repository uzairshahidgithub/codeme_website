'use client'

import { useThemeStore } from '@/stores/theme'
import { AnimatedQuote } from '@/components/ui/AnimatedQuote'
import { CodemoLogo } from '@/components/ui/CodemoLogo'

/**
 * AuthDesktopLogo — uses correctly-cropped SVGs.
 * viewBox="89 600 1477 386" targets the exact logo art bounding box
 * (content was offset by Y=600 with a scale transform inside the SVG).
 */
function AuthDesktopLogo() {
  const isDark = useThemeStore((s) => s.isDark)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={isDark ? '/icons/auth-logo-dark.svg' : '/icons/auth-logo-light.svg'}
      alt="Codemo"
      draggable={false}
      style={{
        display: 'block',
        width: '180px',
        height: 'auto',
        userSelect: 'none',
      }}
    />
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-screen w-full bg-bg-base overflow-y-auto overflow-x-hidden">
      <style>{`

        /* ══════════════════════════════════════════
           MOBILE — single centered column
           ══════════════════════════════════════════ */
        .auth-desktop { display: none; }

        .auth-mobile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 80px 20px 112px;
        }
        .auth-mobile > * {
          width: 100%;
          max-width: 360px;
        }

        /* ══════════════════════════════════════════
           DESKTOP — two-column symmetrical grid
           ══════════════════════════════════════════ */
        @media (min-width: 1024px) {
          .auth-mobile  { display: none; }
          .auth-desktop {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          /* ── Top-left logo anchor ────────────── */
          .auth-logo-bar {
            display: flex;
            align-items: center;
            padding: 36px 0 0 60px;   /* top-left positioning */
            height: 96px;
            flex-shrink: 0;
          }

          /* ── Strict 50/50 two-column grid ─────── */
          .auth-grid {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            /* No border, no divider */
          }

          /* Left column: quote — perfectly centered */
          .auth-col-left {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 60px;
          }
          .auth-col-left > * {
            width: 100%;
            max-width: 440px;
          }

          /* Right column: auth card — perfectly centered */
          .auth-col-right {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 60px;
          }
          .auth-col-right > * {
            width: 100%;
            max-width: var(--auth-box-max-w, 420px) !important;
            padding: var(--auth-box-padding, 40px) !important;
          }
        }
      `}</style>

      {/* ════════ DESKTOP ════════ */}
      <div className="auth-desktop">

        {/* Codemo logo — top-left */}
        <div className="auth-logo-bar">
          <AuthDesktopLogo />
        </div>

        {/* 50/50 grid */}
        <div className="auth-grid">

          {/* Col 1: Animated quote — perfectly centered */}
          <div className="auth-col-left">
            <AnimatedQuote />
          </div>

          {/* Col 2: Auth card — perfectly centered */}
          <div className="auth-col-right">
            {children}
          </div>

        </div>
      </div>

      {/* ════════ MOBILE ════════ */}
      <div className="auth-mobile">
        {children}
      </div>

      {/* Mobile: bottom-center logo only */}
      <div className="lg:hidden absolute bottom-8 left-1/2 -translate-x-1/2 w-[140px]">
        <CodemoLogo width="100%" />
      </div>
    </div>
  )
}
