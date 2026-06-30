import type { ReactNode } from 'react'
import { requireDevPage } from '@/lib/dev/auth'

export default async function DevLayout({ children }: { children: ReactNode }) {
  await requireDevPage()
  return children
}
