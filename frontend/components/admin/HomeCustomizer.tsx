'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteDonationAccountAction,
  deleteTestimonialAction,
  saveContactPortraitAction,
  saveHomeFeaturedCoursesAction,
  saveHomeFeaturedEventsAction,
  upsertDonationAccountAction,
  upsertTestimonialAction,
} from '@/lib/admin/home-actions'

interface Course { id: string; title: string }
interface Event { id: string; title: string }
interface Account { id: string; label: string; account_value: string; account_name: string; sort_order: number }
interface Testimonial { id: string; name: string; role: string | null; content: string; approved: boolean; rating: number }

interface Props {
  courses: Course[]
  events: Event[]
  accounts: Account[]
  featuredCourseIds: string[]
  featuredEventIds: string[]
  portraitUrl: string
  testimonials: Testimonial[]
}

export function HomeCustomizer({
  courses,
  events,
  accounts: initialAccounts,
  featuredCourseIds: initialCourseIds,
  featuredEventIds: initialEventIds,
  portraitUrl: initialPortrait,
  testimonials: initialTestimonials,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const [courseIds, setCourseIds] = useState<string[]>(initialCourseIds)
  const [eventIds, setEventIds] = useState<string[]>(initialEventIds)
  const [portraitUrl, setPortraitUrl] = useState(initialPortrait)

  const [acctForm, setAcctForm] = useState({ label: '', account_value: '', account_name: 'Codemo Teams', sort_order: 0 })
  const [testForm, setTestForm] = useState({ name: '', role: '', content: '', approved: true })

  function run(action: () => Promise<void>, success: string) {
    setError(null)
    setMsg(null)
    startTransition(async () => {
      try {
        await action()
        setMsg(success)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  function toggleId(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  function moveId(list: string[], id: string, dir: -1 | 1, setter: (v: string[]) => void) {
    const i = list.indexOf(id)
    if (i < 0) return
    const j = i + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    setter(next)
  }

  return (
    <div className="flex flex-col gap-10">
      {(error || msg) && (
        <p className={error ? 'text-text-error text-sm' : 'text-text-secondary text-sm'} role="status">
          {error ?? msg}
        </p>
      )}

      <Section title="Home course widgets" hint="Pick and order courses shown on the homepage.">
        <PickerList
          items={courses}
          selected={courseIds}
          onToggle={(id) => toggleId(courseIds, id, setCourseIds)}
          onMove={(id, dir) => moveId(courseIds, id, dir, setCourseIds)}
        />
        <SaveBtn
          pending={pending}
          onClick={() => run(() => saveHomeFeaturedCoursesAction(courseIds), 'Home courses saved.')}
        />
      </Section>

      <Section title="Home events widgets" hint="Pick and order events on the homepage.">
        <PickerList
          items={events}
          selected={eventIds}
          onToggle={(id) => toggleId(eventIds, id, setEventIds)}
          onMove={(id, dir) => moveId(eventIds, id, dir, setEventIds)}
        />
        <SaveBtn
          pending={pending}
          onClick={() => run(() => saveHomeFeaturedEventsAction(eventIds), 'Home events saved.')}
        />
      </Section>

      <Section title="Donation accounts" hint="Shown in the Donate section on the homepage.">
        <ul className="flex flex-col gap-2 mb-4">
          {initialAccounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border)]">
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-primary">{a.label}</div>
                <div className="text-xs text-text-tertiary font-mono truncate">{a.account_value}</div>
              </div>
              <button
                type="button"
                className="text-text-error text-sm shrink-0"
                onClick={() => run(() => deleteDonationAccountAction(a.id), 'Account removed.')}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="codemo-input" placeholder="Label" value={acctForm.label} onChange={(e) => setAcctForm((f) => ({ ...f, label: e.target.value }))} />
          <input className="codemo-input" placeholder="Account / IBAN" value={acctForm.account_value} onChange={(e) => setAcctForm((f) => ({ ...f, account_value: e.target.value }))} />
          <input className="codemo-input" placeholder="Account name" value={acctForm.account_name} onChange={(e) => setAcctForm((f) => ({ ...f, account_name: e.target.value }))} />
          <input className="codemo-input" type="number" placeholder="Sort order" value={acctForm.sort_order} onChange={(e) => setAcctForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
        </div>
        <SaveBtn
          pending={pending}
          label="Add account"
          onClick={() => run(async () => {
            await upsertDonationAccountAction(acctForm)
            setAcctForm({ label: '', account_value: '', account_name: 'Codemo Teams', sort_order: 0 })
          }, 'Account added.')}
        />
      </Section>

      <Section title="Community feedback" hint="Manage testimonials on the homepage.">
        <ul className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
          {initialTestimonials.map((t) => (
            <li key={t.id} className="p-3 rounded-xl border border-[var(--border)] text-sm">
              <div className="font-medium text-text-primary">{t.name} {t.approved ? '' : '(draft)'}</div>
              <div className="text-text-tertiary text-xs line-clamp-2">{t.content}</div>
              <button type="button" className="text-text-error text-xs mt-2" onClick={() => run(() => deleteTestimonialAction(t.id), 'Removed.')}>Delete</button>
            </li>
          ))}
        </ul>
        <div className="grid gap-3">
          <input className="codemo-input" placeholder="Name" value={testForm.name} onChange={(e) => setTestForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="codemo-input" placeholder="Role" value={testForm.role} onChange={(e) => setTestForm((f) => ({ ...f, role: e.target.value }))} />
          <textarea className="codemo-input min-h-[80px]" placeholder="Quote" value={testForm.content} onChange={(e) => setTestForm((f) => ({ ...f, content: e.target.value }))} />
        </div>
        <SaveBtn
          pending={pending}
          label="Add testimonial"
          onClick={() => run(async () => {
            await upsertTestimonialAction(testForm)
            setTestForm({ name: '', role: '', content: '', approved: true })
          }, 'Testimonial added.')}
        />
      </Section>

      <Section title="Reach out image" hint="URL for the contact section portrait (right column).">
        <input className="codemo-input" placeholder="https://…" value={portraitUrl} onChange={(e) => setPortraitUrl(e.target.value)} />
        <SaveBtn
          pending={pending}
          onClick={() => run(() => saveContactPortraitAction(portraitUrl), 'Portrait URL saved.')}
        />
      </Section>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="p-6 rounded-[20px] border border-[var(--border)] bg-bg-surface">
      <h2 className="text-text-primary font-semibold text-lg">{title}</h2>
      <p className="text-text-tertiary text-sm mt-1 mb-4">{hint}</p>
      {children}
    </section>
  )
}

function PickerList({
  items,
  selected,
  onToggle,
  onMove,
}: {
  items: { id: string; title: string }[]
  selected: string[]
  onToggle: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
}) {
  const ordered = selected.map((id) => items.find((i) => i.id === id)).filter(Boolean) as { id: string; title: string }[]
  const rest = items.filter((i) => !selected.includes(i.id))

  return (
    <div className="grid gap-4 sm:grid-cols-2 mb-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted mb-2">Selected (in order)</p>
        <ul className="flex flex-col gap-1">
          {ordered.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-bg-surface border border-[var(--border)]">
              <span className="flex-1 truncate">{item.title}</span>
              <button type="button" className="text-text-link text-xs" onClick={() => onMove(item.id, -1)}>↑</button>
              <button type="button" className="text-text-link text-xs" onClick={() => onMove(item.id, 1)}>↓</button>
              <button type="button" className="text-text-error text-xs" onClick={() => onToggle(item.id)}>×</button>
            </li>
          ))}
          {ordered.length === 0 && <li className="text-text-tertiary text-sm">None selected — fallback order is used.</li>}
        </ul>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted mb-2">Available</p>
        <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {rest.map((item) => (
            <li key={item.id}>
              <button type="button" className="w-full text-left text-sm p-2 rounded-lg hover:bg-white/5 truncate" onClick={() => onToggle(item.id)}>
                + {item.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SaveBtn({ pending, onClick, label = 'Save' }: { pending: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      disabled={pending}
      onClick={onClick}
      className="mt-3 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      style={{ background: 'var(--accent-primary)' }}
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}
