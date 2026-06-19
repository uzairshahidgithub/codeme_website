'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleCourseFeaturedAction } from '@/lib/admin/content-actions'

interface Props {
  courseId: string
  featured: boolean
}

export function FeaturedCourseToggle({ courseId, featured }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      await toggleCourseFeaturedAction(courseId, !featured)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title={featured ? 'Remove from featured' : 'Add to featured'}
      className="text-lg leading-none disabled:opacity-50"
      aria-label={featured ? 'Remove from featured courses' : 'Add to featured courses'}
    >
      {featured ? '★' : '☆'}
    </button>
  )
}
