'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows, Float, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

function GlassSphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const m = meshRef.current
    if (!m) return
    const t = state.clock.getElapsedTime()
    m.rotation.set(t * 0.1, t * 0.2, 0)
    m.scale.setScalar(1 + Math.sin(t * 0.5) * 0.05)
  })
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshPhysicalMaterial
          transmission={1}
          thickness={1.5}
          roughness={0.05}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0}
          ior={1.5}
          color="#ffffff"
          attenuationColor="#ffffff"
          attenuationDistance={0.5}
        />
      </mesh>
    </Float>
  )
}

export default function GlassOracle() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      // Disable R3F's built-in pointer event handling so the canvas never
      // intercepts wheel/touch events from the page scroller.
      eventSource={undefined}
      style={{ pointerEvents: 'none', touchAction: 'auto' }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <GlassSphere />
        <ContactShadows position={[0, -2.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
      </Suspense>
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
    </Canvas>
  )
}
