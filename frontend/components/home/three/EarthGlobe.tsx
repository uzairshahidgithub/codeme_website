'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EarthScene } from './EarthScene'
import { useEarthScroll } from './useEarthScroll'
import { useReducedMotion } from '@/lib/hooks/useReducedMotion'

export default function EarthGlobe() {
  const progressRef = useEarthScroll()
  const reducedMotion = useReducedMotion()

  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ fov: 42, position: [0, 0, 2.8] }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <EarthScene progressRef={progressRef} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  )
}
