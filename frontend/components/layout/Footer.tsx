'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { CodemoLogo } from '@/components/ui/CodemoLogo'

/* Outlined line-icons for the social row. Inlined rather
   than pulled from lucide-react because the project ships
   an older lucide build (1.14) that predates brand icons.
   Same line language as the rest of the app: 1.6 stroke,
   round caps + joins, currentColor so hover state can
   re-tint the glyph without re-rendering. */
function LineSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function LinkedinLine() {
  return (
    <LineSvg>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </LineSvg>
  )
}
function YoutubeLine() {
  return (
    <LineSvg>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </LineSvg>
  )
}
function InstagramLine() {
  return (
    <LineSvg>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </LineSvg>
  )
}

const PRODUCT_LINKS = [
  { label: 'Courses', href: '/eduto' },
  { label: 'Events', href: '/events' },
  { label: 'Projects', href: '/projects' },
  { label: 'Team', href: '/team' },
] as const

const COMMUNITY_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Articles', href: '/articles' },
  { label: 'Donate', href: '/#donate' },
  { label: 'Contact', href: '/#contact' },
] as const

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
] as const

const SOCIALS = [
  { label: 'LinkedIn',  href: 'https://www.linkedin.com/company/codemo-teams' },
  { label: 'YouTube',   href: 'https://www.youtube.com/@codemoteams' },
  { label: 'Instagram', href: 'https://www.instagram.com/codemoteams' },
] as const

/* Line-icon mapping. Each glyph uses currentColor so the
   hover state lifts the stroke to the brand color via the
   --brand CSS custom property defined per-anchor. */
const SOCIAL_ICON: Record<(typeof SOCIALS)[number]['label'], () => ReactNode> = {
  LinkedIn:  () => <LinkedinLine />,
  YouTube:   () => <YoutubeLine />,
  Instagram: () => <InstagramLine />,
}

/* Each link gets a subtle brand accent on hover via a CSS
   custom property (--brand) so the icon line lifts to the
   platform's signature color when the user hovers, without
   ever filling the glyph. */
const SOCIAL_BRAND: Record<(typeof SOCIALS)[number]['label'], string> = {
  LinkedIn:  '#0A66C2',
  YouTube:   '#FF0000',
  Instagram: '#E1306C',
}

function reopenCookiesBanner() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('codemo.cookies.accepted')
    window.dispatchEvent(new Event('codemo:cookies:reopen'))
    setTimeout(() => {
      if (!document.querySelector('[data-codemo-cookies]')) {
        window.location.reload()
      }
    }, 200)
  } catch { /* localStorage blocked — no-op */ }
}

function FooterColumn({ title, links }: { title: string; links: ReadonlyArray<{ label: string; href: string }> }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
        {title}
      </div>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex items-center min-h-[28px] text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   MobileFooter — purpose-built for phones. Replaces the
   full-grid footer below md. Reads top → bottom in a
   single column with intentional density:

     · Logo (left-aligned)
     · One-line tagline
     · Social squircle row
     · Hairline
     · Legal links + © year on the same row
     · Reserved space for the BottomNav dock

   No nav columns (Product/Community) — those routes are
   already in the BottomNav. Repeating them in the footer
   was the bloat the user flagged. */
function MobileFooter({ year }: { year: number }) {
  return (
    <div className="md:hidden px-5 pt-8 pb-[calc(var(--mob-dock-height,64px)+var(--mob-dock-bottom,14px)+20px)]">
      {/* Brand */}
      <Link href="/" aria-label="Codemo home" className="inline-flex items-center -ml-1">
        <span
          aria-hidden="true"
          className="block overflow-hidden"
          style={{ width: 150, height: 28 }}
        >
          <span className="block" style={{ marginTop: -60, marginBottom: -60 }}>
            <CodemoLogo width={150} />
          </span>
        </span>
      </Link>

      {/* Tagline — one sentence, kept under ~14 words */}
      <p className="mt-3 text-[13px] leading-[1.5] text-text-secondary font-light max-w-[34ch]">
        A community of future tech leaders building, learning, shipping together.
      </p>

      {/* Social row — outlined line icons, no background tile.
          Each glyph carries the platform's brand color via a
          CSS custom property `--brand` that the hover state
          promotes to the icon stroke (via currentColor). */}
      <div className="mt-5 flex items-center gap-1" aria-label="Social links">
        {SOCIALS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Codemo on ${label}`}
            className="
              group inline-flex h-10 w-10 items-center justify-center rounded-full
              text-text-tertiary transition-colors duration-200 ease-out
              hover:text-[color:var(--brand)]
              hover:bg-[color:color-mix(in_oklab,var(--brand)_10%,transparent)]
              active:scale-95
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]
            "
            style={{ ['--brand' as string]: SOCIAL_BRAND[label] }}
          >
            {SOCIAL_ICON[label]()}
          </a>
        ))}
      </div>

      {/* Hairline divider */}
      <div className="mt-7 pt-4 border-t border-border-subtle">
        {/* Legal row — terse: links + © on a single wrapped
            line so it never bloats. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-tertiary">
          {LEGAL_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={reopenCookiesBanner}
            className="hover:text-text-primary transition-colors"
          >
            Cookies
          </button>
          <span className="basis-full text-text-tertiary mt-1">
            © {year} Codemo Teams
          </span>
        </div>
      </div>
    </div>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      data-screen-label="09 Footer"
      className="relative border-t border-border-subtle"
    >
      {/* Mobile: purpose-built, terse, dock-aware footer. */}
      <MobileFooter year={year} />

      {/* Desktop: full grid (hidden on phone) ─────────── */}
      <div className="hidden md:block">
      <div className="max-w-[1180px] mx-auto px-4 md:px-10 pt-8 md:pt-16 pb-[calc(var(--mob-dock-height,64px)+var(--mob-dock-bottom,14px)+20px)] md:pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-12 gap-6 sm:gap-y-12 sm:gap-x-8">
          {/* Brand. The CodemoLogo SVG ships with a square
              1500×1500 viewBox where the wordmark occupies only
              the central horizontal band — at any `width` the
              `<img>` renders 1:1, adding ~50% of empty padding
              top/bottom that bloats the footer column.
              Fix: render the logo into a fixed-height crop window
              (`overflow:hidden`, height 32 px) with a negative
              vertical offset that lifts the wordmark into view.
              No SVG edits needed and the navbar (which lives in
              a 72 px nav bar that absorbs the padding) is untouched. */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-5 flex flex-col gap-3">
            <Link
              href="/"
              aria-label="Codemo home"
              className="inline-flex items-center -ml-1"
            >
              <span
                aria-hidden="true"
                className="block overflow-hidden"
                style={{ width: 170, height: 32 }}
              >
                <span
                  className="block"
                  style={{ marginTop: -69, marginBottom: -69 }}
                >
                  <CodemoLogo width={170} />
                </span>
              </span>
            </Link>
            {/* Tagline shows on tablet+; on phone the footer
                stays terse to keep the column count low. */}
            <p className="hidden sm:block text-sm leading-relaxed text-text-secondary max-w-sm font-light">
              A community of future tech leaders building, learning and shipping together — no
              gatekeepers between you and the people who walked the path.
            </p>
            <p className="text-[11px] sm:text-xs text-text-tertiary mt-1">
              © {year} Codemo Teams. All rights reserved.
            </p>
          </div>

          <nav aria-label="Product" className="lg:col-span-2">
            <FooterColumn title="Product" links={PRODUCT_LINKS} />
          </nav>

          <nav aria-label="Community" className="lg:col-span-2">
            <FooterColumn title="Community" links={COMMUNITY_LINKS} />
          </nav>

          <div className="col-span-2 sm:col-span-3 lg:col-span-3 flex flex-col gap-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-tertiary">
              Follow
            </div>
            <div className="flex items-center gap-1" aria-label="Social links">
              {SOCIALS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Codemo on ${label}`}
                  /* Outlined line icon — currentColor drives the
                     stroke so the hover transition lifts to the
                     platform brand color without re-rendering. */
                  className="
                    group inline-flex h-11 w-11 items-center justify-center rounded-full
                    text-text-tertiary transition-colors duration-200 ease-out
                    hover:text-[color:var(--brand)]
                    hover:bg-[color:color-mix(in_oklab,var(--brand)_10%,transparent)]
                    active:scale-95
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]
                  "
                  style={{ ['--brand' as string]: SOCIAL_BRAND[label] }}
                >
                  {SOCIAL_ICON[label]()}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Legal strip — terse on mobile, full on desktop. */}
        <div className="mt-6 md:mt-14 pt-4 md:pt-6 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs text-text-tertiary">
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="hover:text-text-primary transition-colors"
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={reopenCookiesBanner}
              className="hover:text-text-primary transition-colors"
            >
              Cookie preferences
            </button>
          </div>
          {/* The "built with care" line is desktop-only — on
              mobile it just adds visual noise to the footer. */}
          <div className="hidden sm:block text-text-tertiary">
            Built with care in Karachi · London · Lisbon.
          </div>
        </div>
      </div>
      </div>
    </footer>
  )
}
