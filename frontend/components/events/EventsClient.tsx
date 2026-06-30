'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { LayoutGrid, List, Calendar as CalendarIcon, MapPin, ArrowRight, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { SpotlightCard } from '@/components/home/SpotlightCard'
import { AddToCalendar } from '@/components/home/AddToCalendar'
import { createClient } from '@/lib/supabase/client'
import { CodemoLogo } from '@/components/ui/CodemoLogo'
import { LoadingDotsCentered } from '@/components/ui/LoadingDots'
import 'react-phone-number-input/style.css'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import { CATEGORY_COLOURS, CATEGORY_LABELS } from '@/lib/schemas/events'

interface PublicEvent {
  id: string
  title: string
  description: string
  category: string
  categoryLabel: string
  date: string
  location: string
}

interface TopicCategory {
  slug: string
  label: string
  color: string
}

const DEFAULT_TOPICS: TopicCategory[] = [
  { slug: 'webinar', label: 'Webinar', color: '#3B82F6' },
  { slug: 'bootcamp', label: 'Bootcamp', color: '#F59E0B' },
  { slug: 'workshop', label: 'Workshop', color: '#10B981' },
  { slug: 'hackathon', label: 'Hackathon', color: '#EF4444' },
]

function categoryColor(slug: string, topics: TopicCategory[]): string {
  const found = topics.find((t) => t.slug === slug)
  if (found) return found.color
  return CATEGORY_COLOURS[slug as keyof typeof CATEGORY_COLOURS] ?? 'var(--blue)'
}

function categoryLabel(slug: string, topics: TopicCategory[]): string {
  const found = topics.find((t) => t.slug === slug)
  if (found) return found.label
  return CATEGORY_LABELS[slug as keyof typeof CATEGORY_LABELS] ?? (slug.charAt(0).toUpperCase() + slug.slice(1))
}

type ViewMode = 'grid' | 'list'
type SortMode = 'newest' | 'oldest' | 'name'

function ArrowSvg({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

function formatDateParts(iso: string): { day: string; date: string; time: string; countdown: string } {
  const d = new Date(iso)
  const day = d.toLocaleString('en-GB', { weekday: 'short' })
  const date = d.toLocaleString('en-GB', { day: '2-digit', month: 'short' })
  const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const daysAway = Math.max(0, Math.round((d.getTime() - Date.now()) / 86400000))
  const countdown =
    daysAway === 0 ? 'Today' :
      daysAway === 1 ? 'Tomorrow' :
        daysAway < 7 ? `In ${daysAway} days` :
          `In ${Math.round(daysAway / 7)} weeks`
  return { day, date, time, countdown }
}

const isEventPast = (dateStr: string) => {
  const eventDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return eventDate < today
}

const checkRegistration = (title: string) => {
  if (typeof window === 'undefined') return null
  try {
    const dataStr = localStorage.getItem('codemo_registrations')
    if (!dataStr) return null
    const data = JSON.parse(dataStr)
    const record = data[title]
    if (!record) return null

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - record.timestamp > SEVEN_DAYS) {
      delete data[title]
      localStorage.setItem('codemo_registrations', JSON.stringify(data))
      return null
    }
    return record
  } catch (e) {
    return null
  }
}

const saveRegistration = (title: string, record: any) => {
  if (typeof window === 'undefined') return
  try {
    const dataStr = localStorage.getItem('codemo_registrations')
    const data = dataStr ? JSON.parse(dataStr) : {}
    data[title] = {
      ...record,
      timestamp: Date.now()
    }
    localStorage.setItem('codemo_registrations', JSON.stringify(data))
  } catch (e) { }
}

export function EventsClient() {
  const [view, setView] = useState<ViewMode>('grid')
  const [sort, setSort] = useState<SortMode>('newest')
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [topicCategories, setTopicCategories] = useState<TopicCategory[]>(DEFAULT_TOPICS)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedEventToRegister, setSelectedEventToRegister] = useState<PublicEvent | null>(null)
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredEvent, setRegisteredEvent] = useState<{
    title: string
    name: string
    eventType: string
    date: string
    isDuplicate?: boolean
  } | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [phone, setPhone] = useState<string | undefined>()

  useEffect(() => {
    const supabase = createClient()
    async function loadEvents() {
      setLoadingEvents(true)
      setLoadError(null)
      const [eventsRes, catsRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, description, category, starts_at, location_title, mode')
          .eq('status', 'published')
          .order('starts_at', { ascending: true }),
        supabase
          .from('content_categories')
          .select('slug, label, color')
          .eq('kind', 'event')
          .order('sort_order', { ascending: true }),
      ])

      if (eventsRes.error) {
        setLoadError(eventsRes.error.message)
        setEvents([])
      } else {
        const topics = (catsRes.data?.length ? catsRes.data : DEFAULT_TOPICS) as TopicCategory[]
        setTopicCategories(topics)
        setEvents(
          (eventsRes.data ?? []).map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            categoryLabel: categoryLabel(row.category, topics),
            date: row.starts_at,
            location: row.location_title || (row.mode === 'online' ? 'Online' : 'In person'),
          })),
        )
      }
      setLoadingEvents(false)
    }
    loadEvents()
  }, [])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedEventToRegister(null)
        setIsSuccessPopupOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleRegisterClick = async (event: PublicEvent) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }

    const existingRegistration = checkRegistration(event.title)
    if (existingRegistration) {
      setSelectedEventToRegister(event)
      setRegisteredEvent({ ...existingRegistration, title: event.title, isDuplicate: true })
      setIsSuccessPopupOpen(true)
      return
    }

    setPhone(undefined)
    setFormErrors({})
    setSelectedEventToRegister(event)
  }

  const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfnM19__8lQKh7DAyIruE3WK3KOUjhUPub3GIw60CnNvknDcQ/formResponse'
  const FIELD_MAP = {
    fullName: 'entry.1712571021',
    email: 'entry.1564838103',
    phone: 'entry.544552344',
    eventTitle: 'entry.1417475026',
    eventType: 'entry.2034004761',
    isMember: 'entry.1265563122'
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    // Validate
    const errors: Record<string, string> = {}
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const isMember = formData.get('isMember') as string

    if (!fullName) errors.fullName = 'Full Name is required'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Valid Email is required'
    if (!phone || !isValidPhoneNumber(phone)) errors.phone = 'Valid phone number is required'
    if (!isMember) errors.isMember = 'Please select Yes or No'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    setFormErrors({})

    const googleFormData = new URLSearchParams()
    googleFormData.append(FIELD_MAP.fullName, fullName)
    googleFormData.append(FIELD_MAP.email, email)
    googleFormData.append(FIELD_MAP.phone, phone || '')
    googleFormData.append(FIELD_MAP.eventTitle, selectedEventToRegister!.title)
    googleFormData.append(FIELD_MAP.eventType, selectedEventToRegister!.categoryLabel)
    googleFormData.append(FIELD_MAP.isMember, isMember)

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/register-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(googleFormData.entries())),
      })

      if (!response.ok) {
        console.error('API Error:', await response.text())
        // Still proceed to success to not block users, but log it
      }

      const newRegistration = {
        title: selectedEventToRegister!.title,
        name: fullName,
        eventType: selectedEventToRegister!.categoryLabel,
        date: new Date().toLocaleDateString('en-GB')
      }

      saveRegistration(selectedEventToRegister!.title, newRegistration)
      setRegisteredEvent(newRegistration)
      setSelectedEventToRegister(null)
      setIsSuccessPopupOpen(true)
    } catch (error) {
      console.error('Submission error:', error)

      const newRegistration = {
        title: selectedEventToRegister!.title,
        name: fullName,
        eventType: selectedEventToRegister!.categoryLabel,
        date: new Date().toLocaleDateString('en-GB')
      }

      saveRegistration(selectedEventToRegister!.title, newRegistration)
      setRegisteredEvent(newRegistration)
      setSelectedEventToRegister(null)
      setIsSuccessPopupOpen(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Closes the success popup AND clears the selected event so the form doesn't re-open
  const handleCloseSuccessPopup = () => {
    setIsSuccessPopupOpen(false)
    setSelectedEventToRegister(null)
  }

  const handleShareLinkedIn = () => {
    if (!registeredEvent) return
    const eventTitle = registeredEvent.title
    const eventType = registeredEvent.eventType
    const userName = registeredEvent.name
    const pageUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://codemo.tech/events')
    const summary = encodeURIComponent(
      `Thrilled to announce that I, ${userName}, have officially registered for "${eventTitle}" — a ${eventType} organized by Codemo! 🚀\n\nLooking forward to learning, building, and connecting with the community. If you're attending too, let's connect!\n\n#Codemo #${eventType} #TechEvents #Developer`
    )
    const linkedInUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${pageUrl}&title=${encodeURIComponent(eventTitle)}&summary=${summary}&source=Codemo`
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=600,height=600')
  }

  const handleDownloadPDF = async () => {
    const html2canvas = (await import('html2canvas')).default
    const { jsPDF } = await import('jspdf')

    const element = document.getElementById('pdf-render-target')
    if (!element) return

    const canvas = await html2canvas(element, { scale: 2, backgroundColor: null })
    const imgData = canvas.toDataURL('image/png')

    // A5 Landscape Dimensions
    const imgWidth = 210 // mm
    const imgHeight = 148 // mm

    const doc = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a5'
    })

    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    doc.save('codemo-event-pass.pdf')
  }
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Monthly Calendar logic (restored for desktop sidebar)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const daysInMonth = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate(), [currentMonth])
  const firstDayOfMonth = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(), [currentMonth])
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth])
  const blanks = useMemo(() => Array.from({ length: firstDayOfMonth }, (_, i) => i), [firstDayOfMonth])

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (selectedDate && isSameDay(selectedDate, clickedDate)) {
      setSelectedDate(null) // deselect
    } else {
      setSelectedDate(clickedDate)
    }
  }

  // Mini-calendar strip: next 14 days
  const calendarStrip = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      return d
    })
  }, [])

  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      const ed = new Date(e.date)
      return ed.getFullYear() === date.getFullYear() &&
        ed.getMonth() === date.getMonth() &&
        ed.getDate() === date.getDate()
    })
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const todayRef = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  const calendarScrollRef = useRef<HTMLDivElement>(null)



  // Filter & Sort Logic
  const filteredEvents = useMemo(() => {
    let result = events.filter(event => {
      // 1. Tag filtering (if empty, show all)
      if (selectedTags.length > 0 && !selectedTags.includes(event.category)) return false

      // 2. Date filtering
      if (selectedDate) {
        const evDate = new Date(event.date)
        if (
          evDate.getFullYear() !== selectedDate.getFullYear() ||
          evDate.getMonth() !== selectedDate.getMonth() ||
          evDate.getDate() !== selectedDate.getDate()
        ) {
          return false
        }
      }

      return true
    })

    result.sort((a, b) => {
      if (sort === 'newest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sort === 'oldest') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sort === 'name') return a.title.localeCompare(b.title)
      return 0
    })

    return result
  }, [selectedTags, selectedDate, sort, events])

  // Handlers
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const handleStripDateClick = (date: Date) => {
    if (selectedDate && isSameDay(selectedDate, date)) {
      setSelectedDate(null)
    } else {
      setSelectedDate(date)
    }
  }

  return (
    <div id="events-root" className="flex flex-col gap-6 md:gap-8 w-full font-sans">

      {/* ── Filter by Topic (all screen sizes) ───────────────── */}
      <section className="p-5 md:p-6 rounded-[26px] border border-border-subtle bg-bg-surface backdrop-blur-[24px] w-full">
        <h3 className="text-[12px] uppercase tracking-[0.16em] font-semibold mb-4 text-text-tertiary">
          Filter by Topic
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          {topicCategories.map(cat => {
            const isActive = selectedTags.includes(cat.slug)
            return (
              <button
                key={cat.slug}
                onClick={() => toggleTag(cat.slug)}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                style={{
                  background: isActive ? 'var(--blue)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text1)',
                  borderColor: isActive ? 'var(--blue)' : 'var(--border)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                  boxShadow: isActive ? '0 4px 16px -4px color-mix(in oklab, var(--blue) 50%, transparent)' : 'none',
                }}
                aria-pressed={isActive}
              >
                {cat.label}
              </button>
            )
          })}
          {(selectedTags.length > 0 || selectedDate) && (
            <button
              onClick={() => { setSelectedTags([]); setSelectedDate(null) }}
              className="flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </section>

      {loadError && (
        <p className="text-text-error text-sm">Could not load events: {loadError}</p>
      )}

      {loadingEvents ? (
        <LoadingDotsCentered label="Loading events" />
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-start w-full">

      {/* LEFT: Events */}
      <div className="flex flex-col w-full min-w-0">

        {/* ── Mini-Calendar Strip (14 days, horizontal scroll, MOBILE ONLY) ─ */}
        <div
          ref={calendarScrollRef}
          className="flex items-center gap-2 mb-6 pb-2 overflow-x-auto scrollbar-hide md:hidden"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {calendarStrip.map((date, i) => {
            const isToday = isSameDay(date, todayRef)
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false
            const dayEvents = getEventsForDate(date)
            const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' })
            const dayNum = date.getDate()
            const monthName = date.toLocaleDateString('en-GB', { month: 'short' })

            return (
              <button
                key={i}
                onClick={() => handleStripDateClick(date)}
                className="shrink-0 flex flex-col items-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                style={{
                  width: 56,
                  padding: '10px 0 8px',
                  borderRadius: 16,
                  background: isSelected ? 'var(--blue)' : 'var(--bg-surface-elevated, var(--card-glass))',
                  border: isToday && !isSelected
                    ? '2px solid var(--blue)'
                    : '1px solid var(--border-subtle)',
                  color: isSelected ? '#fff' : 'var(--text-primary)',
                  boxShadow: isSelected
                    ? '0 4px 16px -4px color-mix(in oklab, var(--blue) 50%, transparent)'
                    : 'none',
                }}
                aria-label={`${dayName} ${dayNum} ${monthName}${dayEvents.length > 0 ? ` — ${dayEvents.length} event(s)` : ''}`}
                aria-pressed={isSelected}
              >
                <span style={{ fontSize: 10, fontWeight: 500, opacity: isSelected ? 0.85 : 0.55, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {dayName}
                </span>
                <span style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
                  {dayNum}
                </span>
                {/* Category-colored dots */}
                <div className="flex items-center gap-0.5 min-h-[6px]">
                  {dayEvents.length > 0
                    ? dayEvents.slice(0, 3).map((ev, j) => (
                      <span
                        key={j}
                        style={{
                          display: 'inline-block',
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          background: isSelected ? '#fff' : categoryColor(ev.category, topicCategories),
                        }}
                      />
                    ))
                    : null
                  }
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Toolbar: View Toggle + Sort ──────────────────────── */}
        <div className="w-full">

          {/* Toolbar: Views & Sorting */}
          <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-border-subtle gap-4">
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-bg-surface-elevated border border-border-subtle">
              <button
                onClick={() => setView('grid')}
                className="p-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                style={{
                  background: view === 'grid' ? 'var(--blue)' : 'transparent',
                  color: view === 'grid' ? '#fff' : 'var(--text-secondary)',
                  boxShadow: view === 'grid' ? '0 2px 8px rgba(26, 72, 254, 0.2)' : 'none'
                }}
                aria-label="Grid View"
                aria-pressed={view === 'grid'}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setView('list')}
                className="p-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                style={{
                  background: view === 'list' ? 'var(--blue)' : 'transparent',
                  color: view === 'list' ? '#fff' : 'var(--text-secondary)',
                  boxShadow: view === 'list' ? '0 2px 8px rgba(26, 72, 254, 0.2)' : 'none'
                }}
                aria-label="List View"
                aria-pressed={view === 'list'}
              >
                <List size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {(selectedTags.length > 0 || selectedDate) && (
                <button
                  onClick={() => { setSelectedTags([]); setSelectedDate(null); }}
                  className="flex items-center gap-1.5 text-[13px] px-3 py-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  <X size={14} />
                  Clear Filters
                </button>
              )}
              <div className="relative" ref={sortRef}>
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 text-[13px] px-4 py-2 rounded-full border border-border-subtle bg-bg-surface-elevated text-text-primary hover:bg-bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                >
                  {sort === 'newest' ? 'Earliest First' : sort === 'oldest' ? 'Latest First' : 'Name A-Z'}
                  <ChevronDown size={14} className="text-text-secondary" />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-[16px] border border-border-subtle bg-bg-surface backdrop-blur-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden z-10 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => { setSort('newest'); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-bg-input transition-colors ${sort === 'newest' ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
                    >
                      Earliest First
                    </button>
                    <button
                      onClick={() => { setSort('oldest'); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-bg-input transition-colors ${sort === 'oldest' ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
                    >
                      Latest First
                    </button>
                    <button
                      onClick={() => { setSort('name'); setIsSortOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-bg-input transition-colors ${sort === 'name' ? 'text-text-primary font-medium' : 'text-text-secondary'}`}
                    >
                      Name A-Z
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-border-subtle bg-bg-surface backdrop-blur-md">
              <CalendarIcon size={40} className="mb-4 text-text-muted" strokeWidth={1.5} />
              <h3 className="text-[20px] font-medium mb-2 tracking-tight text-text-primary">No events found</h3>
              <p className="text-sm text-text-secondary">Try adjusting your filters or selecting a different date.</p>
              <button
                onClick={() => { setSelectedTags([]); setSelectedDate(null); }}
                className="mt-6 px-5 py-2 rounded-full text-[13px] font-medium transition-all text-white hover:-translate-y-0.5"
                style={{ background: 'var(--blue)', boxShadow: '0 8px 22px -12px color-mix(in oklab, var(--blue) 55%, transparent)' }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Content: Grid View (Spotlight Cards matching Home Page) */}
          {view === 'grid' && filteredEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 xl:gap-6">
              {filteredEvents.map(e => {
                const t = formatDateParts(e.date)
                return (
                  <SpotlightCard
                    key={e.id}
                    accent="var(--blue)"
                    className="h-full group"
                    innerClassName="p-7 md:p-8 flex flex-col justify-between h-full min-h-[280px]"
                  >
                    <header className="flex items-center justify-between text-[12px] text-text-tertiary">
                      <span className="font-medium tracking-tight">{t.day} {t.date} · {t.time}</span>
                      <span className="font-medium tracking-tight">{t.countdown}</span>
                    </header>

                    <div className="mt-6 mb-8">
                      <h3 className="font-sans font-medium text-text-primary text-[20px] md:text-[22px] leading-[1.25] tracking-[-0.015em]">
                        {e.title}
                      </h3>
                      <p className="mt-3 text-[14px] leading-relaxed text-text-secondary line-clamp-2 font-light">
                        {e.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border border-current text-text-primary bg-transparent"
                        >
                          {e.categoryLabel}
                        </span>
                      </div>
                    </div>

                    <footer className="flex items-center justify-between gap-3 pt-5 border-t border-border-subtle/70 mt-auto">
                      {isEventPast(e.date) ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium text-text-muted bg-bg-input cursor-not-allowed border border-border-subtle"
                        >
                          Event Ended at {t.date}
                        </button>
                      ) : (
                        <button
                          className="
                          inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                          text-[13px] font-medium text-white
                          transition-transform duration-200 group-hover:-translate-y-0.5
                        "
                          style={{
                            background: 'var(--blue)',
                            boxShadow: '0 8px 22px -12px color-mix(in oklab, var(--blue) 55%, transparent)',
                          }}
                          onClick={() => handleRegisterClick(e)}
                        >
                          Register
                          <ArrowSvg size={11} />
                        </button>
                      )}
                      <AddToCalendar
                        event={{
                          title: e.title,
                          description: e.description,
                          start: e.date,
                          location: e.location,
                        }}
                      />
                    </footer>
                  </SpotlightCard>
                )
              })}
            </div>
          )}

          {/* Content: List View */}
          {view === 'list' && filteredEvents.length > 0 && (
            <div className="flex flex-col gap-4">
              {filteredEvents.map(e => {
                const t = formatDateParts(e.date)
                return (
                  <div
                    key={e.id}
                    className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-5 md:p-6 rounded-[24px] border transition-all cursor-pointer group hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] bg-bg-surface border-border-subtle"
                    tabIndex={0}
                  >
                    {/* Left: Event Details */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-current text-text-primary bg-transparent"
                        >
                          {e.categoryLabel}
                        </span>
                        <span className="text-[12px] font-medium text-text-tertiary">{t.day} {t.date} · {t.time}</span>
                      </div>
                      <h3 className="text-[18px] md:text-[20px] font-medium leading-[1.25] tracking-[-0.015em] text-text-primary truncate">
                        {e.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                        <MapPin size={14} className="opacity-70" /> {e.location}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="w-full sm:w-auto mt-2 sm:mt-0 flex items-center justify-end gap-3 shrink-0">
                      <AddToCalendar
                        iconOnly
                        event={{
                          title: e.title,
                          description: e.description,
                          start: e.date,
                          location: e.location,
                        }}
                        className="p-2.5 rounded-full border border-border-subtle bg-bg-surface-elevated hover:bg-bg-input text-text-secondary hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                      />
                      {isEventPast(e.date) ? (
                        <button disabled className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-medium text-text-muted bg-bg-input cursor-not-allowed border border-border-subtle">
                          Ended
                        </button>
                      ) : (
                        <button onClick={() => handleRegisterClick(e)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-medium text-text-primary border border-border-subtle hover:bg-bg-input transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">
                          Register
                          <ArrowSvg size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>

      </div>

      {/* RIGHT: Calendar sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-full sticky top-[112px] max-h-[calc(100vh-112px)] overflow-y-auto scrollbar-hide pb-8">

          {/* Calendar Widget */}
          <div className="p-6 rounded-[26px] border border-border-subtle bg-bg-surface backdrop-blur-[24px]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-medium tracking-tight text-text-primary">
                {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1">
                <button onClick={handlePrevMonth} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-input hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" aria-label="Previous Month">
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <button onClick={handleNextMonth} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-input hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary" aria-label="Next Month">
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-[11px] font-medium text-text-tertiary">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
              {blanks.map(b => (
                <div key={`b-${b}`} className="aspect-square" />
              ))}
              {days.map(day => {
                const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                const isSelected = selectedDate && isSameDay(selectedDate, dateObj)

                // Find events on this day
                const dayEvents = events.filter(e => {
                  const eDate = new Date(e.date)
                  // Filter by active tags as well if any are selected
                  if (selectedTags.length > 0 && !selectedTags.includes(e.category)) return false
                  return isSameDay(eDate, dateObj)
                })

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className="relative aspect-square flex items-center justify-center rounded-full text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
                    style={{
                      color: isSelected ? '#fff' : (dayEvents.length > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)'),
                      background: isSelected ? 'var(--blue)' : (dayEvents.length > 0 ? 'var(--bg-input)' : 'transparent'),
                      fontWeight: isSelected || dayEvents.length > 0 ? 500 : 400,
                      boxShadow: isSelected ? '0 4px 12px -2px color-mix(in oklab, var(--blue) 50%, transparent)' : 'none'
                    }}
                    aria-pressed={!!isSelected}
                    aria-label={`${dateObj.toLocaleDateString()} ${dayEvents.length > 0 ? 'Has Events' : ''}`}
                  >
                    {day}
                    {/* Subtle dots to indicate event days (when not selected) */}
                    {dayEvents.length > 0 && !isSelected && (
                      <div className="absolute bottom-1 flex gap-0.5 items-center justify-center">
                        {dayEvents.slice(0, 3).map((ev, j) => (
                          <span
                            key={j}
                            style={{
                              display: 'inline-block',
                              width: 4,
                              height: 4,
                              borderRadius: 999,
                              background: 'var(--blue)',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

      </aside>

      </div>
      </>
      )}

      {/* Registration Modal */}
      {selectedEventToRegister && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-backdrop backdrop-blur-[12px]">
          <div className="absolute inset-0" onClick={() => setSelectedEventToRegister(null)} />
          <div className="relative w-full max-w-md p-6 sm:p-8 rounded-[24px] bg-bg-surface border border-border-subtle shadow-2xl overflow-hidden glass-card">
            <button
              onClick={() => setSelectedEventToRegister(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-text-tertiary hover:text-text-primary hover:bg-bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-semibold text-text-primary mb-2">Register for Event</h2>
            <p className="text-sm text-text-secondary mb-6 leading-relaxed">{selectedEventToRegister.title}</p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  className={`w-full px-4 py-2.5 bg-bg-input border ${formErrors.fullName ? 'border-red-500/50' : 'border-border-subtle'} rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all`}
                  placeholder="John Doe"
                />
                {formErrors.fullName && <p className="mt-1.5 text-xs text-red-500">{formErrors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Email *</label>
                <input
                  type="email"
                  name="email"
                  className={`w-full px-4 py-2.5 bg-bg-input border ${formErrors.email ? 'border-red-500/50' : 'border-border-subtle'} rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-all`}
                  placeholder="john@example.com"
                />
                {formErrors.email && <p className="mt-1.5 text-xs text-red-500">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone *</label>
                <div className={`w-full px-4 py-2.5 bg-bg-input border ${formErrors.phone ? 'border-red-500/50' : 'border-border-subtle'} rounded-xl focus-within:ring-2 focus-within:ring-accent-primary transition-all`}>
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={phone}
                    onChange={setPhone}
                    className="flex items-center gap-2 [&>input]:w-full [&>input]:bg-transparent [&>input]:border-none [&>input]:outline-none [&>input]:text-text-primary [&>input]:placeholder:text-text-muted [&>.PhoneInputCountry]:mr-2"
                  />
                </div>
                {formErrors.phone && <p className="mt-1.5 text-xs text-red-500">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Event Type</label>
                <input
                  type="text"
                  name="eventType"
                  value={selectedEventToRegister.categoryLabel}
                  readOnly
                  className="w-full px-4 py-2.5 bg-bg-surface-elevated border border-border-subtle rounded-xl text-text-tertiary cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Community Member? *</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="isMember" value="Yes" className="w-4 h-4 text-accent-primary bg-bg-input border-border-subtle focus:ring-accent-primary" />
                    <span className="text-sm text-text-primary group-hover:text-accent-primary transition-colors">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="isMember" value="No" className="w-4 h-4 text-accent-primary bg-bg-input border-border-subtle focus:ring-accent-primary" />
                    <span className="text-sm text-text-primary group-hover:text-accent-primary transition-colors">No</span>
                  </label>
                </div>
                {formErrors.isMember && <p className="mt-1.5 text-xs text-red-500">{formErrors.isMember}</p>}
              </div>

              <div className="pt-4 mt-6 border-t border-border-subtle/50">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-full text-[14px] font-medium text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: 'var(--blue)', boxShadow: '0 8px 22px -12px color-mix(in oklab, var(--blue) 55%, transparent)' }}
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                  {!isSubmitting && <ArrowRight size={14} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {isSuccessPopupOpen && registeredEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center py-6 px-4 modal-backdrop backdrop-blur-[12px]">
          <div className="absolute inset-0" onClick={handleCloseSuccessPopup} />
          <div className="relative w-full max-w-sm flex flex-col items-center">

            <div className="codemo-pass-wrapper w-full">
              <article className="codemo-event-pass">
                <div className="pass-clip-slot"></div>

                <div className="pass-header">
                  <div className="w-24">
                    <CodemoLogo width="100%" />
                  </div>
                  <span className="pass-type-badge">{registeredEvent.eventType}</span>
                </div>

                <div className="pass-body">
                  <h2 className="pass-title">{registeredEvent.title}</h2>
                  <p className="pass-subtitle">
                    {registeredEvent.isDuplicate ? 'ALREADY REGISTERED' : 'REGISTRATION CONFIRMED'}
                  </p>
                </div>

                <div className="pass-footer">
                  <div className="pass-meta-group">
                    <span className="meta-label">ATTENDEE</span>
                    <span className="meta-value">{registeredEvent.name}</span>
                  </div>

                  <div className="pass-meta-group">
                    <span className="meta-label">DATE ISSUED</span>
                    <span className="meta-value">{registeredEvent.date}</span>
                  </div>

                </div>
              </article>
            </div>

            <div className="flex w-full flex-col gap-2 px-4 mt-5">
              <button
                onClick={handleDownloadPDF}
                className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 rounded-full text-[14px] font-medium text-white transition-all hover:scale-[1.02]"
                style={{ background: 'var(--blue)', boxShadow: '0 8px 22px -12px color-mix(in oklab, var(--blue) 55%, transparent)' }}
              >
                Download PDF
              </button>

              {/* LinkedIn Share Button */}
              <button
                onClick={handleShareLinkedIn}
                className="w-full inline-flex justify-center items-center gap-2.5 px-6 py-3 rounded-full text-[14px] font-medium text-white transition-all hover:scale-[1.02] hover:brightness-110"
                style={{ background: '#0A66C2', boxShadow: '0 8px 22px -12px rgba(10,102,194,0.5)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Share on LinkedIn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Render Target */}
      {registeredEvent && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -9999 }}>
          <div id="pdf-render-target" style={{
            width: '1050px',
            height: '740px',
            background: '#000000',
            position: 'relative',
            fontFamily: "var(--font-poppins, 'Poppins', sans-serif)",
            overflow: 'hidden'
          }}>
            {/* Top Border Accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '12px', background: 'var(--blue, #00b4d8)' }} />

            {/* Logo */}
            <div style={{ position: 'absolute', top: '64px', left: '64px', width: '200px' }}>
              <CodemoLogo width="100%" />
            </div>

            {/* Subtitle */}
            <div style={{ position: 'absolute', top: '76px', right: '64px', color: 'var(--blue, #00b4d8)', fontSize: '22px', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
              Event Registration Confirmed
            </div>

            {/* Event Title */}
            <div style={{ position: 'absolute', top: '220px', left: '64px', width: '922px' }}>
              <h1 style={{ fontSize: '72px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.1, textTransform: 'uppercase', overflowWrap: 'break-word' }}>
                {registeredEvent.title}
              </h1>
            </div>

            {/* Event Type Badge */}
            <div style={{ position: 'absolute', top: '420px', left: '64px', color: '#ffffff', fontSize: '22px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {registeredEvent.eventType || 'Bootcamp'}
            </div>

            {/* User Name */}
            <div style={{ position: 'absolute', bottom: '80px', left: '64px' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Attendee</div>
              <div style={{ color: '#ffffff', fontSize: '40px', fontWeight: 700 }}>{registeredEvent.name}</div>
            </div>

            {/* Registration Date */}
            <div style={{ position: 'absolute', bottom: '80px', left: '500px' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '18px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>Date Registered</div>
              <div style={{ color: '#ffffff', fontSize: '32px', fontWeight: 600 }}>{registeredEvent.date}</div>
            </div>

            {/* Bottom Border Accent */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '6px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      )}

    </div>
  )
}
