'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { cn } from '@/lib/utils'

type Section = 'menu' | 'change-password'

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ]
  const strength = checks.filter(Boolean).length
  const colours = ['#ff5c5c', '#ff5c5c', '#f59e0b', '#f59e0b', '#22c55e']
  const colour = password ? colours[strength - 1] ?? '#ff5c5c' : 'var(--border)'

  return (
    <div className="flex gap-1 mt-1.5" aria-hidden="true">
      {checks.map((_, i) => (
        <div
          key={i}
          className="flex-1 h-[3px] rounded-full transition-colors duration-200"
          style={{ background: i < strength ? colour : 'var(--border)' }}
        />
      ))}
    </div>
  )
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ChangePasswordSection({ onBack }: { onBack: () => void }) {
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })
  const newPassword = watch('newPassword', '')

  async function onSubmit(data: PasswordForm) {
    setServerError('')
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    setSaving(false)
    if (error) { setServerError(error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 px-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-text-primary text-center" style={{ fontSize: 15, fontWeight: 600 }}>Password updated</p>
        <p className="text-text-tertiary text-center" style={{ fontSize: 13 }}>Your password has been changed successfully.</p>
        <button
          onClick={onBack}
          className="mt-2 text-accent-primary hover:underline focus-visible:outline-none"
          style={{ fontSize: 13 }}
        >
          Back to Settings
        </button>
      </div>
    )
  }

  const inputCls = 'w-full h-[48px] rounded-xl px-4 pr-12 text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-accent-primary caret-accent-primary'

  return (
    <div className="flex flex-col gap-5 px-6 py-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-text-tertiary hover:text-text-primary transition-colors w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded"
        style={{ fontSize: 13 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <div>
        <h3 className="text-text-primary" style={{ fontSize: 16, fontWeight: 600 }}>Change Password</h3>
        <p className="text-text-tertiary mt-1" style={{ fontSize: 12 }}>Choose a strong password to secure your account.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)() }} className="flex flex-col gap-4">
        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sp-new" className="text-text-secondary" style={{ fontSize: 12, fontWeight: 500 }}>New Password</label>
          <div className="relative">
            <input
              id="sp-new"
              type={showNew ? 'text' : 'password'}
              placeholder="New password"
              autoComplete="new-password"
              className={inputCls}
              style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              <EyeIcon show={showNew} />
            </button>
          </div>
          <PasswordStrengthBar password={newPassword} />
          {errors.newPassword && <p className="text-xs text-text-error">{errors.newPassword.message}</p>}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sp-confirm" className="text-text-secondary" style={{ fontSize: 12, fontWeight: 500 }}>Confirm Password</label>
          <div className="relative">
            <input
              id="sp-confirm"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className={inputCls}
              style={{ background: 'var(--input-glass)', border: '1px solid var(--border)' }}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              <EyeIcon show={showConfirm} />
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-text-error">{errors.confirmPassword.message}</p>}
        </div>

        {serverError && <p className="text-center text-sm text-text-error">{serverError}</p>}

        <div className="flex justify-center pt-1">
          <Button
            variant="primary"
            className="w-[180px] h-[46px]"
            onClick={handleSubmit(onSubmit)}
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? 'Saving…' : 'Update Password'}
          </Button>
        </div>
      </form>
    </div>
  )
}

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  onEditProfile?: () => void
}

export function SettingsDrawer({ open, onClose, onEditProfile }: SettingsDrawerProps) {
  const router = useRouter()
  const [section, setSection] = useState<Section>('menu')

  // Reset to the top-level menu each time the drawer opens
  useEffect(() => {
    if (open) setSection('menu')
  }, [open])

  async function handleSignOut() {
    onClose()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
    router.refresh()
  }

  const menuItems = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: 'Edit Profile',
      onClick: () => { onClose(); onEditProfile?.() },
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
      label: 'Change Password',
      onClick: () => setSection('change-password'),
    },
  ]

  return (
    <Drawer open={open} onClose={onClose} title={section === 'menu' ? 'Settings' : undefined}>
      {section === 'change-password' ? (
        <ChangePasswordSection onBack={() => setSection('menu')} />
      ) : (
        <div className="flex flex-col px-6 py-5 gap-2">
          {menuItems.map(({ icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className={cn(
                'flex items-center gap-4 w-full rounded-[14px] text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
              )}
              style={{ padding: '14px 12px', fontSize: 14 }}
            >
              <span className="text-text-tertiary shrink-0">{icon}</span>
              <span className="flex-1 text-left font-medium">{label}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}

          {/* Divider + sign out */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
            <button
              onClick={handleSignOut}
              className={cn(
                'flex items-center gap-4 w-full rounded-[14px] hover:bg-white/[0.04] transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-error',
              )}
              style={{ padding: '14px 12px', fontSize: 14, color: '#ff5c5c' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="flex-1 text-left font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </Drawer>
  )
}
