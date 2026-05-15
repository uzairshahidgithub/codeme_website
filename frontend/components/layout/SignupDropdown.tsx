'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { SocialButton } from '@/components/ui/SocialButton'

type Provider = 'google' | 'github'

interface SignupDropdownProps {
  onClose: () => void
}

export function SignupDropdown({ onClose }: SignupDropdownProps) {
  async function signInWithProvider(provider: Provider) {
    onClose()
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div
      className="absolute top-[calc(100%+10px)] right-0 w-[310px] glass-card rounded-[22px] p-[26px] z-[500]"
      role="dialog"
      aria-label="Sign up or log in"
    >
      {/* Tabs */}
      <div className="flex gap-[10px] mb-[20px]">
        <Link
          href="/auth/signup"
          onClick={onClose}
          className="flex items-center justify-center flex-1 rounded-[30px] font-medium glass-btn-primary hover:brightness-110 transition-[filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ padding: '14px 28px', fontSize: '16px', letterSpacing: '0.01em' }}
        >
          Sign up
        </Link>
        <Link
          href="/auth/login"
          onClick={onClose}
          className="flex items-center justify-center flex-1 rounded-[30px] font-medium glass-chip text-text-secondary hover:brightness-110 transition-[filter] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          style={{ padding: '14px 28px', fontSize: '16px', letterSpacing: '0.01em' }}
        >
          Login
        </Link>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-[14px]">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-text-tertiary whitespace-nowrap" style={{ fontSize: '13px', fontWeight: 500 }}>
          or Continue via
        </span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      {/* Social providers */}
      <div className="flex justify-center gap-[24px] mt-[20px]">
        <SocialButton provider="google" onClick={() => signInWithProvider('google')} />
        <SocialButton provider="github" onClick={() => signInWithProvider('github')} />
      </div>
    </div>
  )
}
