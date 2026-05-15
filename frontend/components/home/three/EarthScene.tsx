'use client'

import { useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

interface EarthSceneProps {
  progressRef: MutableRefObject<number>
  reducedMotion: boolean
}

const TEX = {
  day:      '/textures/earth/earth_daymap.jpg',
  normal:   '/textures/earth/earth_normal_map.jpg',
  specular: '/textures/earth/earth_specular_map.png',
  clouds:   '/textures/earth/earth_clouds.png',
  night:    '/textures/earth/earth_night.png',
} as const

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function EarthScene({ progressRef, reducedMotion }: EarthSceneProps) {
  const earth = useRef<THREE.Mesh>(null)
  const nightOverlay = useRef<THREE.Mesh>(null)
  const clouds = useRef<THREE.Mesh>(null)
  const atmosphere = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const day = useTexture(TEX.day)
  const normal = useTexture(TEX.normal)
  const specular = useTexture(TEX.specular)
  const cloudMap = useTexture(TEX.clouds)
  const night = useTexture(TEX.night)

  ;[day, normal, specular, cloudMap, night].forEach((t) => {
    if (t) {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
    }
  })

  useFrame((_, delta) => {
    const p = progressRef.current

    if (!reducedMotion && earth.current) {
      earth.current.rotation.y += delta * 0.06
    }
    if (!reducedMotion && nightOverlay.current) {
      nightOverlay.current.rotation.y += delta * 0.06
    }
    if (!reducedMotion && clouds.current) {
      clouds.current.rotation.y += delta * 0.025
    }

    const targetX = lerp(0, -1.4, p)
    camera.position.x = lerp(camera.position.x, targetX, 0.08)

    if (earth.current) {
      const extra = p * 0.4
      earth.current.rotation.y += extra * delta * 0.5
    }

    const targetOpacity = 1 - p * 0.35
    if (earth.current) {
      const m = earth.current.material as THREE.MeshPhongMaterial
      m.opacity = lerp(m.opacity, targetOpacity, 0.1)
      m.transparent = true
    }
    if (atmosphere.current) {
      const m = atmosphere.current.material as THREE.MeshBasicMaterial
      m.opacity = lerp(m.opacity, 0.08 * targetOpacity, 0.1)
    }
  })

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={1.3} color="#ffffff" />
      <pointLight position={[-5, -2, -5]} intensity={0.4} color="#2D7FF9" />

      {/* Earth base — day map + normal + specular */}
      <mesh ref={earth}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhongMaterial
          map={day}
          normalMap={normal}
          specularMap={specular}
          specular={new THREE.Color('#2a2a2a')}
          shininess={12}
        />
      </mesh>

      {/* Night lights overlay — additive blending so dark side glows */}
      <mesh ref={nightOverlay}>
        <sphereGeometry args={[1.001, 96, 96]} />
        <meshBasicMaterial
          map={night}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={clouds}>
        <sphereGeometry args={[1.008, 96, 96]} />
        <meshPhongMaterial
          map={cloudMap}
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphere} scale={1.05}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#2D7FF9"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      <Stars radius={80} depth={40} count={3500} factor={3.5} saturation={0} fade speed={0.6} />

      {!reducedMotion && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.25} intensity={0.45} mipmapBlur />
        </EffectComposer>
      )}
    </>
  )
}
