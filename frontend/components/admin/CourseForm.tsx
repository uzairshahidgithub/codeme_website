'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCourseAction } from '@/lib/admin/content-actions'
import { CourseSchema, type CourseInput, type CourseLevel, type CourseStatus } from '@/lib/schemas/courses'

interface Props {
  mode: 'create' | 'edit'
  initial?: Partial<CourseInput> & { id?: string }
}

const LEVELS: CourseLevel[] = ['beginner', 'intermediate', 'advanced']

export function CourseForm({ mode, initial }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [shortDescription, setShortDescription] = useState(initial?.short_description ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url ?? '')
  const [level, setLevel] = useState<CourseLevel>(initial?.level ?? 'beginner')
  const [instructorName, setInstructorName] = useState(initial?.instructor_name ?? '')
  const [durationHours, setDurationHours] = useState(String(initial?.duration_hours ?? 1))
  const [durationLabel, setDurationLabel] = useState(initial?.duration_label ?? '')
  const [enrolledCount, setEnrolledCount] = useState(String(initial?.enrolled_count ?? 0))
  const [category, setCategory] = useState(initial?.category ?? '')
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '))
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false)
  const [featuredLabel, setFeaturedLabel] = useState(initial?.featured_label ?? 'Featured')
  const [featuredSortOrder, setFeaturedSortOrder] = useState(String(initial?.featured_sort_order ?? 0))
  const [price, setPrice] = useState(String(initial?.price ?? 0))
  const [originalPrice, setOriginalPrice] = useState(initial?.original_price != null ? String(initial.original_price) : '')
  const [rating, setRating] = useState(String(initial?.rating ?? 4.5))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(status: CourseStatus) {
    setError(null)
    const payload: CourseInput = {
      title,
      description,
      short_description: shortDescription || '',
      thumbnail_url: thumbnailUrl || '',
      level,
      instructor_name: instructorName,
      duration_hours: Number(durationHours) || 1,
      duration_label: durationLabel || '',
      enrolled_count: Number(enrolledCount) || 0,
      category: category || '',
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      status,
      is_featured: isFeatured,
      featured_label: isFeatured ? featuredLabel : '',
      featured_sort_order: Number(featuredSortOrder) || 0,
      price: Number(price) || 0,
      original_price: originalPrice ? Number(originalPrice) : null,
      rating: Number(rating) || 4.5,
    }

    const parsed = CourseSchema.safeParse(payload)
    if (!parsed.success) {
      const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      setError(msg ?? 'Validation failed')
      return
    }

    setSubmitting(true)
    try {
      await upsertCourseAction({
        ...parsed.data,
        id: mode === 'edit' ? initial?.id : undefined,
      })
      router.push('/admin/courses')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit('published') }} className="flex flex-col gap-6 max-w-[820px]">
      <Field label="Title" required>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="codemo-input" />
      </Field>
      <Field label="Description" required>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="codemo-input" style={{ minHeight: 120, resize: 'vertical', padding: '14px 16px' }} />
      </Field>
      <Field label="Short description (cards)">
        <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One line for homepage / Eduto cards" className="codemo-input" />
      </Field>
      <Field label="Instructor" required>
        <input type="text" value={instructorName} onChange={(e) => setInstructorName(e.target.value)} required className="codemo-input" />
      </Field>
      <Field label="Level">
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((l) => (
            <button key={l} type="button" onClick={() => setLevel(l)} className="capitalize" style={pillStyle(level === l)}>{l}</button>
          ))}
        </div>
      </Field>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Duration (hours)" required>
          <input type="number" min={1} value={durationHours} onChange={(e) => setDurationHours(e.target.value)} className="codemo-input" />
        </Field>
        <Field label="Duration label (Eduto)">
          <input type="text" value={durationLabel} onChange={(e) => setDurationLabel(e.target.value)} placeholder="e.g. 8 Weeks" className="codemo-input" />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Enrolled count">
          <input type="number" min={0} value={enrolledCount} onChange={(e) => setEnrolledCount(e.target.value)} className="codemo-input" />
        </Field>
        <Field label="Rating (0–5)">
          <input type="number" min={0} max={5} step={0.1} value={rating} onChange={(e) => setRating(e.target.value)} className="codemo-input" />
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Price">
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="codemo-input" />
        </Field>
        <Field label="Original price (optional)">
          <input type="number" min={0} value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Strike-through price on Eduto" className="codemo-input" />
        </Field>
      </div>
      <Field label="Category slug">
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Frontend, AI, Security" className="codemo-input" />
      </Field>
      <Field label="Tags (comma-separated)">
        <input type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="AI, Python, Web" className="codemo-input" />
      </Field>
      <Field label="Thumbnail URL">
        <input type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" className="codemo-input" />
      </Field>

      <div
        className="flex flex-col gap-4 rounded-xl p-4"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent-primary)]"
          />
          <span className="text-text-primary text-sm font-medium">Feature on homepage &amp; Eduto</span>
        </label>
        {isFeatured && (
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Featured badge label">
              <input type="text" value={featuredLabel} onChange={(e) => setFeaturedLabel(e.target.value)} placeholder="Flash Sale, Trending, New…" className="codemo-input" />
            </Field>
            <Field label="Featured sort order">
              <input type="number" min={0} value={featuredSortOrder} onChange={(e) => setFeaturedSortOrder(e.target.value)} className="codemo-input" />
            </Field>
          </div>
        )}
      </div>

      {error && <p className="text-text-error text-sm">{error}</p>}
      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => submit('draft')} disabled={submitting} className="codemo-input" style={{ height: 52, borderRadius: 999 }}>Save as Draft</button>
        <button type="submit" disabled={submitting} style={{ height: 52, borderRadius: 999, background: 'var(--accent-primary)', color: '#fff', fontWeight: 600 }}>
          {submitting ? 'Saving…' : 'Publish Course'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-text-secondary text-sm font-medium">{label}{required && ' *'}</label>
      {children}
    </div>
  )
}

function pillStyle(active: boolean): React.CSSProperties {
  return {
    height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
    background: active ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: '1px solid ' + (active ? 'var(--accent-primary)' : 'var(--border)'),
  }
}
