'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CodemoLogo } from '@/components/ui/CodemoLogo'

export default function SignupSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.replace('/'), 2500)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full bg-bg-base cursor-pointer"
      onClick={() => router.replace('/')}
      role="button"
      aria-label="Click to continue to home"
    >
      {/* Radial blue glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="glow-blue-radial rounded-full"
          style={{ width: '800px', height: '800px' }}
        />
      </div>

      {/* Text */}
      <p
        className="relative text-text-primary text-center z-10 text-4xl lg:text-[56px] px-4"
        style={{ fontWeight: 300, letterSpacing: '1px', lineHeight: 1.2 }}
      >
        Register Successful
      </p>

      {/* Footer logo */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
        <CodemoLogo width={220} />
      </div>
    </div>
  )
}
