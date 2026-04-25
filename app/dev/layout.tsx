'use client'

import { useEffect } from 'react'

export default function DevLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Mark body so globals.css skips overflow:hidden for this route
    document.body.classList.add('dev-page')
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.body.style.width = '100%'
    return () => {
      document.body.classList.remove('dev-page')
      document.body.style.overflow = ''
      document.body.style.height = ''
      document.body.style.width = ''
    }
  }, [])

  return <>{children}</>
}
