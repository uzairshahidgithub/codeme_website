import Link from 'next/link'

interface AdminStubProps {
  title: string
  eyebrow: string
  description: string
  todo?: string
}

export function AdminStub({ title, eyebrow, description }: AdminStubProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="home-mono-eyebrow">Admin · {eyebrow}</span>
        <h1 className="text-text-primary" style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h1>
      </header>
      <div
        className="flex flex-col gap-4 items-start"
        style={{ background: 'var(--card-glass)', border: '1px solid var(--border)', borderRadius: 22, padding: 32 }}
      >
        <p className="text-text-secondary" style={{ fontSize: 15, lineHeight: 1.55 }}>{description}</p>
        <p className="text-text-tertiary" style={{ fontSize: 13 }}>Coming soon.</p>
        <Link href="/admin" className="inline-flex items-center gap-2 rounded-full mt-2" style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text1)', fontSize: 13, fontWeight: 500, border: '1px solid var(--border)' }}>
          ← Back to dashboard
        </Link>
      </div>
    </div>
  )
}
