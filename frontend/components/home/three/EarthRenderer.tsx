'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

const EarthGlobe = dynamic(() => import('./EarthGlobe'), { ssr: false })

/**
 * Local Three.js Earth — uses the day/night/normal/specular/clouds maps copied
 * from Codemo Assets/59-earth/textures into public/textures/earth/.
 *
 * No NASA iframe fallback. Reduced-motion users get a static styled disc so
 * we never render a dependency on third-party content.
 */
export function EarthRenderer() {
  const reduced = useReducedMotion()
  const [texturesAvailable, setTexturesAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/textures/earth/earth_daymap.jpg', { method: 'HEAD' })
      .then((r) => { if (!cancelled) setTexturesAvailable(r.ok) })
      .catch(() => { if (!cancelled) setTexturesAvailable(false) })
    return () => { cancelled = true }
  }, [])

  if (reduced || texturesAvailable === false) {
    return <StaticEarth />
  }

  if (texturesAvailable === null) {
    return <SceneSkeleton />
  }

  return <EarthGlobe />
}

function StaticEarth() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        aria-hidden="true"
        style={{
          width: '78%', aspectRatio: '1 / 1', borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #4ea0ff 0%, #1d4ed8 35%, #0a1a3a 75%, #000 100%)',
          boxShadow: '0 0 80px rgba(45,127,249,0.35), inset -30px -30px 80px rgba(0,0,0,0.6)',
        }}
      />
    </div>
  )
}

function SceneSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        aria-hidden="true"
        className="animate-pulse"
        style={{
          width: '70%', aspectRatio: '1 / 1', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,127,249,0.25), rgba(45,127,249,0.05) 60%, transparent 75%)',
        }}
      />
    </div>
  )
}
