'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  label: string
  deleteAction: (id: string) => Promise<void>
}

export function AdminDeleteButton({ id, label, deleteAction }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return
    setPending(true)
    try {
      await deleteAction(id)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-text-error disabled:opacity-50"
      style={{ fontSize: 13 }}
    >
      {pending ? '…' : 'Delete'}
    </button>
  )
}
