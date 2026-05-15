const STATS: ReadonlyArray<readonly [string, string]> = [
  ['12.4K', 'Members'],
  ['340+',  'Tutorials shipped'],
  ['48',    'Live channels'],
  ['96%',   'Land their first role'],
] as const

export function HomeStats() {
  return (
    <section id="home-stats" className="stats stats-bento" data-screen-label="02 Stats">
      <div className="stats-shell max-w-6xl mx-auto bg-bg-surface border border-border-subtle rounded-2xl p-8 my-16 shadow-lg transition-colors duration-300 ease-in-out">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-border-subtle">
          {STATS.map(([n, l]) => (
            <div key={l} className="stat flex flex-col items-start md:px-6 first:pl-0 last:pr-0">
              <div className="stat-n text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
                {n}
              </div>
              <div className="stat-l text-xs md:text-sm text-text-tertiary mt-2 uppercase tracking-wider font-semibold">
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
