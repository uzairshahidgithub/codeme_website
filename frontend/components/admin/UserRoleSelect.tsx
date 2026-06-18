'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRoleAction } from '@/lib/admin/content-actions'

const ROLES = ['member', 'moderator', 'admin', 'super_admin'] as const
type UserRole = (typeof ROLES)[number]

interface Props {
  userId: string
  currentRole: string
  disabled?: boolean
}

export function UserRoleSelect({ userId, currentRole, disabled }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onChange(next: string) {
    if (next === currentRole || disabled) return
    setError(null)
    startTransition(async () => {
      try {
        await updateUserRoleAction(userId, next as UserRole)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update role')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={currentRole}
        disabled={disabled || pending}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50"
        style={{
          background: 'var(--input-glass)',
          border: '1px solid var(--border)',
          padding: '6px 10px',
          fontSize: 13,
          minWidth: 120,
        }}
        aria-label="User role"
      >
        {ROLES.map((role) => (
          <option key={role} value={role}>
            {role.replace('_', ' ')}
          </option>
        ))}
      </select>
      {error && <span className="text-text-error" style={{ fontSize: 11 }}>{error}</span>}
    </div>
  )
}
