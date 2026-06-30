'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRoleAction } from '@/lib/admin/content-actions'
import { ASSIGNABLE_ROLES, type AssignableRole } from '@/lib/roles'

interface Props {
  userId: string
  currentRole: string
  disabled?: boolean
}

const ROLE_LABELS: Record<AssignableRole, string> = {
  member: 'Member',
  dev: 'Dev',
  admin: 'Admin',
  super_admin: 'Super admin',
}

export function UserRoleSelect({ userId, currentRole, disabled }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const displayRole = ASSIGNABLE_ROLES.includes(currentRole as AssignableRole)
    ? currentRole
    : 'member'

  function onChange(next: string) {
    if (next === currentRole || disabled) return
    setError(null)
    startTransition(async () => {
      try {
        await updateUserRoleAction(userId, next as AssignableRole)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update role')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={displayRole}
        disabled={disabled || pending}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg text-text-primary bg-bg-surface border border-[var(--border)] outline-none focus:ring-2 focus:ring-accent-primary disabled:opacity-50 dark:bg-bg-surface dark:text-text-primary"
        style={{
          padding: '6px 10px',
          fontSize: 13,
          minWidth: 130,
        }}
        aria-label="User role"
      >
        {ASSIGNABLE_ROLES.map((role) => (
          <option key={role} value={role} className="bg-bg-surface text-text-primary">
            {ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      {error && <span className="text-text-error" style={{ fontSize: 11 }}>{error}</span>}
    </div>
  )
}
