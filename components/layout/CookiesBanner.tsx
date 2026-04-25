'use client'

import { useEffect, useState } from 'react'

export function CookiesBanner() {
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('codemo.cookies.accepted') !== 'true') {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem('codemo.cookies.accepted', 'true')
    setHiding(true)
    setTimeout(() => setVisible(false), 200)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed lg:bottom-[32px] bottom-[90px] left-1/2 -translate-x-1/2 z-[400] flex flex-col lg:flex-row items-center lg:justify-between justify-center w-[calc(100%-28px)] lg:w-auto max-w-[400px] lg:max-w-none glass-card rounded-[22px] lg:rounded-[40px] transition-opacity duration-200 ${
        hiding ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ padding: '20px 24px', gap: '16px', background: '#212121', border: '1px solid rgba(255,255,255,0.08)' }}
      role="region"
      aria-label="Cookie consent"
      aria-live="polite"
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
          style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 500, letterSpacing: '0.01em', background: '#2463eb', color: '#fff' }}
        >
          Accept
        </button>
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 lg:flex-none rounded-[12px] lg:rounded-[30px] text-text-secondary hover:brightness-110 transition-[filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary inline-flex items-center justify-center"
          style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 500, letterSpacing: '0.01em', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Learn More
        </a>
      </div>
    </div>
  )
}
