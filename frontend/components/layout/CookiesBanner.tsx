'use client'

import { useEffect, useState } from 'react'

export function CookiesBanner() {
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('codemo.cookies.accepted') !== 'true') {
      setVisible(true)
    }
    // Footer's "Cookie Preferences" link dispatches this event to re-open the banner.
    function reopen() {
      setHiding(false)
      setVisible(true)
    }
    window.addEventListener('codemo:cookies:reopen', reopen)
    return () => window.removeEventListener('codemo:cookies:reopen', reopen)
  }, [])

  function accept() {
    localStorage.setItem('codemo.cookies.accepted', 'true')
    setHiding(true)
    setTimeout(() => setVisible(false), 200)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed lg:bottom-[32px] bottom-[90px] left-1/2 -translate-x-1/2 z-[400] flex flex-col lg:flex-row items-center lg:justify-between justify-center w-[calc(100%-28px)] max-w-[400px] lg:w-[720px] lg:max-w-[720px] glass-card rounded-[22px] lg:rounded-[40px] transition-opacity duration-200 ${
        hiding ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ padding: '20px 24px', gap: '16px' }}
      role="region"
      aria-label="Cookie consent"
      aria-live="polite"
      data-codemo-cookies
    >
      <span
        className="text-text-primary text-center lg:text-left"
        style={{ fontSize: '16px', fontWeight: 500 }}
      >
        Essential Cookies
      </span>

      <div className="flex items-center gap-[12px] w-full lg:w-auto">
        <button
          onClick={accept}
          className="flex-1 lg:flex-none rounded-[12px] lg:rounded-[30px] glass-btn-primary hover:brightness-110 transition-[filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 500, letterSpacing: '0.01em', background: 'var(--blue)', color: '#fff' }}
        >
          Accept
        </button>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 lg:flex-none rounded-[12px] lg:rounded-[30px] text-text-secondary hover:brightness-110 transition-[filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary inline-flex items-center justify-center"
          style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 500, letterSpacing: '0.01em', background: 'var(--chip-glass)', border: '1px solid var(--border)' }}
        >
          Learn More
        </a>
      </div>
    </div>
  )
}
