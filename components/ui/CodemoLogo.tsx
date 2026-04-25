'use client'

import { useEffect, useState } from 'react'
import { useThemeStore } from '@/stores/theme'

/**
 * CodemoLogo — Theme-aware logo.
 *
 * Uses a `mounted` guard to prevent SSR/client hydration mismatch:
 * - Server always renders the dark logo (matches `isDark: true` default).
 * - After mount, switches to the correct theme-aware src.
 *
 * `suppressHydrationWarning` on the <img> silences any residual warning
 * in case the inline <head> script has already flipped the theme class
 * before React hydrates.
 */
export function CodemoLogo({ width = 220 }: { width?: number | string }) {
  const isDark = useThemeStore((s) => s.isDark)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Before mount: always render the dark logo to match SSR default (isDark: true).
  // After mount: use the real theme value from the store.
  const src = mounted && !isDark
    ? '/icons/codemo-logo-light.svg'
    : '/icons/codemo-logo-dark.svg'

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Codemo"
      className="no-drag block"
      style={{ width, height: 'auto' }}
      draggable={false}
      suppressHydrationWarning
    />
  )
}
