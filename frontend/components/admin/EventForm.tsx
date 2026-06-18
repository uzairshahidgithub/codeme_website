'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { upsertEventAction } from '@/lib/admin/content-actions'
import { CreateEventSchema, type CreateEventInput } from '@/lib/schemas/events'
import type { CategoryRow } from '@/lib/schemas/categories'

interface Props {
  initial?: Partial<CreateEventInput> & { id?: string }
  mode: 'create' | 'edit'
}

const CATEGORIES_FALLBACK = ['webinar', 'bootcamp', 'workshop', 'hackathon', 'seminar', 'conference', 'other']

function isoToLocalInput(iso: string | undefined | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localInputToIso(s: string): string {
  if (!s) return ''
  return new Date(s).toISOString()
}

function durationLabel(startsLocal: string, endsLocal: string): string {
  if (!startsLocal || !endsLocal) return ''
  const ms = new Date(endsLocal).getTime() - new Date(startsLocal).getTime()
  if (ms <= 0) return ''
  const h = Math.floor(ms / 3600000)
  const m = Math.round((ms % 3600000) / 60000)
  return `${h ? `${h} hour${h === 1 ? '' : 's'} ` : ''}${m} minute${m === 1 ? '' : 's'}`
}

export function EventForm({ initial, mode }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [eventMode, setEventMode] = useState<'online' | 'physical'>(initial?.mode ?? 'online')
  const [locationTitle, setLocationTitle] = useState(initial?.location_title ?? '')
  const [locationLink, setLocationLink] = useState(initial?.location_link ?? '')
  const [category, setCategory] = useState(initial?.category ?? 'webinar')
  const [categoryOptions, setCategoryOptions] = useState<string[]>(CATEGORIES_FALLBACK)
  const [startsLocal, setStartsLocal] = useState(isoToLocalInput(initial?.starts_at))
  const [endsLocal, setEndsLocal] = useState(isoToLocalInput(initial?.ends_at))
  const [isRecurring, setIsRecurring] = useState(initial?.is_recurring ?? false)
  const [recFreq, setRecFreq] = useState<'YEARLY' | 'MONTHLY' | 'WEEKLY'>('YEARLY')
  const [recLabel, setRecLabel] = useState(initial?.recurrence_label ?? '')
  const [bannerUrl, setBannerUrl] = useState(initial?.banner_url ?? '')
  const [bannerUploading, setBannerUploading] = useState(false)
  const [maxAttendees, setMaxAttendees] = useState<string>(initial?.max_attendees?.toString() ?? '')
  const [certEnabled, setCertEnabled] = useState(initial?.cert_enabled ?? false)
  const [certTemplateUrl, setCertTemplateUrl] = useState(initial?.cert_template_url ?? '')
  const [certUploading, setCertUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const duration = useMemo(() => durationLabel(startsLocal, endsLocal), [startsLocal, endsLocal])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('content_categories')
      .select('slug, label')
      .eq('kind', 'event')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        const rows = (data ?? []) as Pick<CategoryRow, 'slug'>[]
        if (rows.length > 0) {
          setCategoryOptions(rows.map((r) => r.slug))
        }
      })
  }, [])

  const buildRrule = (): string => {
    let rule = `FREQ=${recFreq}`
    if (recFreq === 'YEARLY' && startsLocal) {
      const d = new Date(startsLocal)
      rule += `;BYMONTH=${d.getMonth() + 1};BYMONTHDAY=${d.getDate()}`
    } else if (recFreq === 'MONTHLY' && startsLocal) {
      const d = new Date(startsLocal)
      rule += `;BYMONTHDAY=${d.getDate()}`
    } else if (recFreq === 'WEEKLY' && startsLocal) {
      const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
      rule += `;BYDAY=${days[new Date(startsLocal).getDay()]}`
    }
    return rule
  }

  async function uploadFile(file: File, folder: 'banners' | 'cert-templates'): Promise<string | null> {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('event-assets').upload(path, file, {
      contentType: file.type, upsert: false,
    })
    if (error) {
      setError(`Upload failed: ${error.message}`)
      return null
    }
    const { data } = await supabase.storage.from('event-assets').createSignedUrl(path, 60 * 60 * 24 * 365 * 5)
    return data?.signedUrl ?? null
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Banner must be under 5MB'); return }
    setBannerUploading(true)
    const url = await uploadFile(file, 'banners')
    setBannerUploading(false)
    if (url) setBannerUrl(url)
  }

  async function handleCertChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCertUploading(true)
    const url = await uploadFile(file, 'cert-templates')
    setCertUploading(false)
    if (url) setCertTemplateUrl(url)
  }

  async function submit(status: 'draft' | 'published') {
    setError(null)
    const payload: CreateEventInput = {
      title, description, mode: eventMode, location_title: locationTitle,
      location_link: locationLink || undefined,
      category, starts_at: localInputToIso(startsLocal), ends_at: localInputToIso(endsLocal),
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? buildRrule() : undefined,
      recurrence_label: isRecurring ? recLabel : undefined,
      max_attendees: maxAttendees ? Number(maxAttendees) : null,
      cert_enabled: certEnabled,
      banner_url: bannerUrl || undefined,
      cert_template_url: certEnabled ? certTemplateUrl : undefined,
      status,
    }
    const parsed = CreateEventSchema.safeParse(payload)
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0]
      setError(first ?? 'Validation failed')
      return
    }

    setSubmitting(true)
    try {
      await upsertEventAction({
        ...parsed.data,
        id: mode === 'edit' ? initial!.id : undefined,
      })
      router.push('/admin/events')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit('published') }} className="flex flex-col gap-6 max-w-[820px]">
      <Field label="Main Title" required>
        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
          maxLength={100} minLength={3}
          className="codemo-input"
        />
      </Field>

      <Field label="Description" required>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)} required
          minLength={20} maxLength={2000}
          className="codemo-input"
          style={{ minHeight: 120, resize: 'vertical', padding: '14px 16px' }}
        />
      </Field>

      <Field label="Mode">
        <div className="flex gap-2">
          <PillToggle active={eventMode === 'online'} onClick={() => setEventMode('online')}>Online</PillToggle>
          <PillToggle active={eventMode === 'physical'} onClick={() => setEventMode('physical')}>Physical</PillToggle>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <input
            type="text" value={locationTitle} onChange={(e) => setLocationTitle(e.target.value)}
            placeholder={eventMode === 'online' ? 'e.g. Google Meet, Zoom, Teams' : 'e.g. Codemo HQ, Karachi Tech Hub'}
            className="codemo-input" required minLength={2} maxLength={100}
          />
          <input
            type="url" value={locationLink} onChange={(e) => setLocationLink(e.target.value)}
            placeholder={eventMode === 'online' ? 'https://meet.google.com/…' : 'https://maps.google.com/…'}
            className="codemo-input"
          />
        </div>
      </Field>

      <Field label="Duration">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-text-muted" style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase' }}>Start</span>
            <input type="datetime-local" value={startsLocal} onChange={(e) => setStartsLocal(e.target.value)} required className="codemo-input" />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-text-muted" style={{ fontSize: 12, fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase' }}>End</span>
            <input type="datetime-local" value={endsLocal} onChange={(e) => setEndsLocal(e.target.value)} required className="codemo-input" />
          </label>
        </div>
        {duration && (
          <p className="text-text-muted mt-2" style={{ fontSize: 13 }}>Duration: {duration}</p>
        )}
      </Field>

      <Field label="Category">
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((c) => (
            <button
              key={c} type="button" onClick={() => setCategory(c)}
              className="capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
              style={{
                height: 38, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                background: category === c ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                color: category === c ? '#fff' : 'var(--text-secondary)',
                border: '1px solid ' + (category === c ? 'var(--accent-primary)' : 'var(--border)'),
              }}
            >{c}</button>
          ))}
        </div>
      </Field>

      <Field label="Recurring Event">
        <ToggleSwitch checked={isRecurring} onChange={setIsRecurring} label="Fixed Annual / Recurring Event" />
        {isRecurring && (
          <div className="flex flex-col gap-3 mt-3">
            <div className="flex gap-2">
              {(['YEARLY', 'MONTHLY', 'WEEKLY'] as const).map((f) => (
                <PillToggle key={f} active={recFreq === f} onClick={() => setRecFreq(f)}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </PillToggle>
              ))}
            </div>
            <input
              type="text" value={recLabel} onChange={(e) => setRecLabel(e.target.value)}
              placeholder='Human label e.g. "Annual Codemo Summit"' className="codemo-input"
            />
            {startsLocal && (
              <p className="text-text-muted" style={{ fontSize: 13 }}>
                Repeats {recFreq.toLowerCase()} from {new Date(startsLocal).toLocaleDateString('en-GB', { day: '2-digit', month: 'long' })}
              </p>
            )}
          </div>
        )}
      </Field>

      <Field label="Banner Image">
        <input
          type="file" accept="image/jpeg,image/png,image/webp"
          onChange={handleBannerChange}
          className="text-text-secondary"
          style={{ fontSize: 14 }}
        />
        {bannerUploading && <p className="text-text-muted mt-2" style={{ fontSize: 13 }}>Uploading…</p>}
        {bannerUrl && (
          <div className="relative mt-3" style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' }}>
            <Image src={bannerUrl} alt="" fill sizes="820px" className="object-cover" />
          </div>
        )}
      </Field>

      <Field label="Max Attendees (optional)">
        <input
          type="number" min={1} value={maxAttendees}
          onChange={(e) => setMaxAttendees(e.target.value)}
          placeholder="Unlimited" className="codemo-input"
        />
      </Field>

      <Field label="Certificate">
        <ToggleSwitch checked={certEnabled} onChange={setCertEnabled} label="Enable Certificate for Attendees" />
        {certEnabled && (
          <div className="flex flex-col gap-3 mt-3">
            <input
              type="file" accept="image/png,image/jpeg,application/pdf"
              onChange={handleCertChange}
              className="text-text-secondary" style={{ fontSize: 14 }}
            />
            {certUploading && <p className="text-text-muted" style={{ fontSize: 13 }}>Uploading…</p>}
            {certTemplateUrl && (
              <div className="relative" style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-input)' }}>
                {certTemplateUrl.toLowerCase().includes('.pdf') ? (
                  <div className="flex items-center justify-center h-full text-text-tertiary" style={{ fontSize: 14 }}>
                    PDF template uploaded
                  </div>
                ) : (
                  <Image src={certTemplateUrl} alt="" fill sizes="820px" className="object-contain" />
                )}
              </div>
            )}
            <p className="text-text-muted italic" style={{ fontSize: 12 }}>
              Template should include {'{name}'} {'{event}'} {'{date}'} placeholders for auto-generation.
            </p>
          </div>
        )}
      </Field>

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.12)', color: '#EF4444',
            border: '1px solid rgba(239,68,68,0.4)', padding: '12px 16px', borderRadius: 12, fontSize: 14,
          }}
        >{error}</div>
      )}

      <div className="flex flex-col gap-3 mt-2">
        <button
          type="button" onClick={() => submit('draft')} disabled={submitting}
          className="w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-60"
          style={{
            height: 52, borderRadius: 999, background: 'transparent',
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            fontSize: 15, fontWeight: 500,
          }}
        >Save as Draft</button>
        <button
          type="submit" disabled={submitting}
          aria-label={submitting ? 'Publishing event' : 'Publish event'}
          className="alive-trigger alive-primary w-full text-base font-semibold text-white rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ height: 52, background: 'var(--accent-primary)' }}
        >{submitting ? 'Saving…' : 'Publish Event'}</button>
      </div>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-text-secondary" style={{ fontSize: 14, fontWeight: 500 }}>
        {label} {required && <span className="text-text-error">*</span>}
      </label>
      {children}
    </div>
  )
}

function PillToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button" onClick={onClick}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
      style={{
        height: 48, padding: '0 24px', borderRadius: 999, fontSize: 14, fontWeight: 500,
        background: active ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: '1px solid ' + (active ? 'var(--accent-primary)' : 'var(--border)'),
        transition: 'background 160ms ease',
      }}
    >{children}</button>
  )
}

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
      className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
    >
      <span
        style={{
          width: 44, height: 24, borderRadius: 999,
          background: checked ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
          border: '1px solid var(--border)', position: 'relative', transition: 'background 160ms ease',
          display: 'inline-block',
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2, width: 18, height: 18,
          borderRadius: 999, background: '#fff', transition: 'left 160ms ease',
        }} />
      </span>
      <span className="text-text-secondary" style={{ fontSize: 14 }}>{label}</span>
    </button>
  )
}
