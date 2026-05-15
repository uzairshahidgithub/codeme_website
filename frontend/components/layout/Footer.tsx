'use client'

import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Team', href: '/team' },
  { label: 'Events', href: '/events' },
  { label: 'Articles', href: '/articles' },
  { label: 'eLearn', href: '/eduto' },
  { label: 'Projects', href: '/projects' },
] as const

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .26.18.58.69.48A10 10 0 0 0 12 2z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.55c0-1.32-.02-3.02-1.84-3.02-1.84 0-2.12 1.44-2.12 2.92V21h-4V9z" />
    </svg>
  )
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

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="foot" data-screen-label="07 Footer">
      <div className="foot-top">
        <div className="foot-brand">
          <span className="foot-brand-mark">◐</span>
          <span>Codemo</span>
        </div>
        <ul className="foot-nav" aria-label="Footer navigation">
          {NAV_LINKS.map((l) => (
            <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
          ))}
        </ul>
        <div className="foot-social" aria-label="Social links">
          <a href="https://github.com/uzairshahidgithub/Codemo-Website" target="_blank" rel="noopener noreferrer" aria-label="Codemo on GitHub">
            <GitHubIcon />
          </a>
          <a href="https://www.linkedin.com/company/codemo-teams" target="_blank" rel="noopener noreferrer" aria-label="Codemo on LinkedIn">
            <LinkedInIcon />
          </a>
        </div>
      </div>
      <div className="foot-divider" />
      <div className="foot-bot">
        <div>© {year} Codemo Teams. All rights reserved.</div>
        <div className="foot-legal">
          <Link href="/privacy">Privacy Policy</Link>
          <span aria-hidden="true">·</span>
          <button type="button" onClick={reopenCookiesBanner} style={{ background: 'transparent', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}>
            Cookie Preferences
          </button>
          <span aria-hidden="true">·</span>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
