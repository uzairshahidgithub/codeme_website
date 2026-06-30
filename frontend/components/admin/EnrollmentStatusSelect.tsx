'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface Props {
  id: string
  status: string
  colour: { bg: string; fg: string; border: string }
  updateAction: (id: string, status: 'pending' | 'verified' | 'cleared') => Promise<void>
}

const STATUSES = ['pending', 'verified', 'cleared'] as const

export function EnrollmentStatusSelect({ id, status, colour, updateAction }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as typeof STATUSES[number]
        startTransition(async () => {
          await updateAction(id, next)
          router.refresh()
        })
      }}
      className="rounded-full text-xs font-medium capitalize border cursor-pointer bg-bg-surface text-text-primary"
      style={{
        background: colour.bg,
        color: colour.fg,
        border: `1px solid ${colour.border}`,
        padding: '4px 10px',
      }}
      aria-label="Enrollment status"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-bg-surface text-text-primary capitalize">{s}</option>
      ))}
    </select>
  )
}
