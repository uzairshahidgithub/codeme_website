'use client'

import { useEffect } from 'react'

import { DEFAULT_CONFIG } from '@/lib/config/devTheme'

export function DevThemeProvider() {
  useEffect(() => {
    function applyConfig(configStr: string | null) {
      try {
        const parsed = configStr ? JSON.parse(configStr) : {}
        const merged = { ...DEFAULT_CONFIG, ...parsed }
        for (const [key, value] of Object.entries(merged)) {
          document.documentElement.style.setProperty(key, value as string)
        }
      } catch(e) {}
    }

    // Apply on mount (using saved or defaults)
    const saved = localStorage.getItem('codemo-dev-theme')
    applyConfig(saved)

    // Listen for cross-tab changes
    function handleStorage(e: StorageEvent) {
      if (e.key === 'codemo-dev-theme' && e.newValue) {
        applyConfig(e.newValue)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return null
}
