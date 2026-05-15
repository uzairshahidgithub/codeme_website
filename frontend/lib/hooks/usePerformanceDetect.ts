'use client'

import { useEffect, useState } from 'react'

export type PerformanceTier = 'high' | 'low' | 'unknown'

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
}

/**
 * Cheap heuristic: cores >= 4 AND device memory >= 4 GB → 'high'.
 * Anything else (or browsers that don't expose the APIs) → 'low'.
 *
 * The home page uses this to choose between Three.js Earth (high) and
 * the NASA iframe fallback (low). Returns 'unknown' on first render so
 * the server-rendered markup matches; switches to a real tier after mount.
 */
export function usePerformanceDetect(): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>('unknown')

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      setTier('low')
      return
    }
    const cores = navigator.hardwareConcurrency ?? 0
    const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 0
    const isHigh = cores >= 4 && (memory === 0 || memory >= 4)
    setTier(isHigh ? 'high' : 'low')
  }, [])

  return tier
}
