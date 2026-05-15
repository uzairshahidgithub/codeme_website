import { Briefcase, Mail, MessageSquare } from 'lucide-react'

const CHANNELS = [
  {
    icon: Mail,
    label: 'Email',
    target: 'team@codemoteam.org',
    href: 'mailto:team@codemoteam.org',
    hint: 'Answered within 24h',
  },
  {
    icon: MessageSquare,
    label: 'Discord',
    target: 'discord.gg/codemo',
    href: 'https://discord.gg/codemo',
    hint: 'Community lives here',
  },
  {
    icon: Briefcase,
    label: 'Enterprise',
    target: 'partnerships@codemoteam.org',
    href: 'mailto:partnerships@codemoteam.org',
    hint: 'Hiring · sponsorship · curriculum',
  },
] as const

function ArrowUp() {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

export function ContactSection() {
  return (
    <section
      data-screen-label="08 Contact"
      className="bg-white dark:bg-[#0A0A0A] transition-colors duration-300 ease-in-out"
    >
      <div className="max-w-6xl mx-auto px-5 md:px-12 py-20 md:py-28">
        {/* "Reach Out" banner — mesh gradient backdrop + border-glow frame */}
        <div className="relative rounded-3xl overflow-hidden border-glow">
          <div
            className="
              relative rounded-[calc(theme(borderRadius.3xl)-1px)]
              bg-gray-50 dark:bg-[#0F0F11]
              border border-gray-200/70 dark:border-white/[0.06]
              overflow-hidden
            "
          >
            {/* Soft mesh-gradient wash */}
            <div aria-hidden="true" className="absolute inset-0 mesh-gradient opacity-90 dark:opacity-100" />
            {/* Stripe-grid texture (subtle) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06] mix-blend-overlay"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(0,0,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.4) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
              }}
            />

            <div className="relative px-6 sm:px-10 md:px-14 py-14 md:py-20">
              <header className="max-w-2xl">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                  <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  Reach out
                </span>
                <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-gray-900 dark:text-white">
                  <span className="font-sans">Talk to a human </span>
                  <span className="font-serif italic font-normal gradient-text-blue">at Codemo.</span>
                </h2>
                <p className="mt-4 text-base md:text-lg leading-relaxed text-gray-600 dark:text-gray-400 max-w-xl">
                  Three ways in — pick whichever fits the conversation. No forms, no funnels, no sales team.
                </p>
              </header>

              {/* Inline channel rail — scannable, scan-line aligned */}
              <ul className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 md:divide-x divide-gray-200/70 dark:divide-white/[0.08]">
                {CHANNELS.map(({ icon: Icon, label, target, href, hint }, i) => {
                  const external = href.startsWith('http')
                  return (
                    <li key={label} className={i === 0 ? 'md:pl-0' : 'md:pl-8'}>
                      <a
                        href={href}
                        target={external ? '_blank' : undefined}
                        rel={external ? 'noopener noreferrer' : undefined}
                        className="
                          group flex flex-col gap-2 min-h-[44px] py-3
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md
                        "
                      >
                        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-500">
                          <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
                          {label}
                        </span>
                        <span className="inline-flex items-center gap-2 text-[17px] md:text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          <span className="truncate">{target}</span>
                          <span
                            aria-hidden="true"
                            className="inline-flex shrink-0 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all"
                          >
                            <ArrowUp />
                          </span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500">{hint}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
