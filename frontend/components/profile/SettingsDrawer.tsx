'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Check, ChevronLeft, ChevronRight, CircleAlert,
  Eye, EyeOff, KeyRound, Loader2, LogOut, UserPen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Drawer } from '@/components/ui/Drawer'
import { cn } from '@/lib/utils'

/* Shared input styling — matches EditProfileDrawer for visual
   consistency across the settings flow. Uses explicit
   color-mix() backgrounds because Tailwind's
   bg-text-primary/[alpha] syntax can fall back to opaque
   white when the underlying color is a CSS variable. */
const inputBase =
  'w-full h-11 rounded-[12px] px-3.5 text-[14px] text-text-primary placeholder:text-text-tertiary outline-none transition-all border border-border-subtle hover:border-border-subtle/80 focus:border-[color:var(--blue)] focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--blue)_18%,transparent)] caret-accent-primary bg-[color:color-mix(in_oklab,var(--text1)_7%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--text1)_10%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--text1)_13%,transparent)]'

/* Minimal settings row — just a line icon and a label, no
   coloured squircle background. Icon inherits text colour so
   it brightens with the row's hover state. */
function SettingsRow({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-4 w-full rounded-[12px] px-3 py-3',
        'text-text-secondary hover:text-text-primary hover:bg-text-primary/[0.05]',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
        destructive && 'hover:text-[#ff5c5c]',
      )}
    >
      <span
        className={cn(
          'shrink-0 transition-colors',
          destructive ? 'text-[#ff5c5c]' : 'text-text-tertiary group-hover:text-text-primary',
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className={cn('flex-1 text-left text-[14px] font-medium', destructive && 'text-[#ff5c5c]')}>
        {label}
      </span>
      {!destructive && (
        <ChevronRight size={14} className="text-text-tertiary shrink-0" aria-hidden />
      )}
    </button>
  )
}

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
      <div className="flex flex-col items-center gap-4 py-14 px-6 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'color-mix(in oklab, #22c55e 14%, transparent)', border: '1px solid color-mix(in oklab, #22c55e 30%, transparent)' }}
        >
          <Check size={26} strokeWidth={2.4} color="#22c55e" aria-hidden />
        </div>
        <div>
          <p className="text-text-primary text-[15px] font-semibold">Password updated</p>
          <p className="text-text-tertiary text-[13px] mt-1">Your password has been changed successfully.</p>
        </div>
        <button
          onClick={onBack}
          className="mt-2 text-[color:var(--blue)] hover:underline focus-visible:outline-none text-[13px] font-medium"
        >
          Back to Settings
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-text-tertiary hover:text-text-primary transition-colors w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded text-[13px]"
      >
        <ChevronLeft size={15} aria-hidden />
        Back to Settings
      </button>

      <div>
        <h3 className="text-text-primary text-[18px] font-semibold tracking-tight">Change Password</h3>
        <p className="text-text-tertiary mt-1 text-[13px] leading-snug">
          Choose a strong password to keep your account secure.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)() }} className="flex flex-col gap-4">
        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sp-new" className="text-text-secondary text-[12px] font-medium tracking-wide">
            New password
          </label>
          <div className="relative">
            <input
              id="sp-new"
              type={showNew ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={cn(inputBase, 'pr-11')}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label={showNew ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showNew ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
          <PasswordStrengthBar password={newPassword} />
          {errors.newPassword && (
            <p className="text-[12px] text-text-error flex items-center gap-1.5">
              <CircleAlert size={12} aria-hidden /> {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sp-confirm" className="text-text-secondary text-[12px] font-medium tracking-wide">
            Confirm new password
          </label>
          <div className="relative">
            <input
              id="sp-confirm"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-type your new password"
              autoComplete="new-password"
              className={cn(inputBase, 'pr-11')}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-[12px] text-text-error flex items-center gap-1.5">
              <CircleAlert size={12} aria-hidden /> {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="rounded-[10px] px-3 py-2 text-[12.5px] text-text-error bg-[color:color-mix(in_oklab,#ff5c5c_10%,transparent)] border border-[color:color-mix(in_oklab,#ff5c5c_30%,transparent)]">
            {serverError}
          </p>
        )}

        {/* Action bar — matches EditProfileDrawer */}
        <div className="flex items-center justify-end gap-2 pt-3 mt-1">
          <button
            type="button"
            onClick={onBack}
            className="h-11 px-4 rounded-full text-[13.5px] font-medium text-text-secondary hover:text-text-primary hover:bg-text-primary/[0.05] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-[13.5px] font-medium text-white transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            style={{
              background: 'var(--blue)',
              boxShadow: '0 8px 20px -10px color-mix(in oklab, var(--blue) 65%, transparent)',
            }}
          >
            {saving && <Loader2 size={14} className="animate-spin" aria-hidden />}
            {saving ? 'Updating…' : 'Update password'}
          </button>
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

  return (
    <Drawer open={open} onClose={onClose} title={section === 'menu' ? 'Settings' : undefined}>
      {section === 'change-password' ? (
        <ChangePasswordSection onBack={() => setSection('menu')} />
      ) : (
        <div className="flex flex-col px-5 py-5 gap-1">
          <SettingsRow
            icon={<UserPen size={18} strokeWidth={1.6} />}
            label="Edit Profile"
            onClick={() => { onClose(); onEditProfile?.() }}
          />
          <SettingsRow
            icon={<KeyRound size={18} strokeWidth={1.6} />}
            label="Change Password"
            onClick={() => setSection('change-password')}
          />

          <div className="my-2 border-t border-border-subtle" />

          <SettingsRow
            icon={<LogOut size={18} strokeWidth={1.6} />}
            label="Sign Out"
            destructive
            onClick={handleSignOut}
          />
        </div>
      )}
    </Drawer>
  )
}
