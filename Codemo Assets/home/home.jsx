/* Codemo Teams home page — single-file React mockup
   Aesthetic: airy premium / glassmorphism. Palette 3: warm cream + ink + sage + gold.
   All animation points marked TODO:GSAP — initial CSS states keep content visible. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "glass": 18,
  "accent": "sage"
}/*EDITMODE-END*/;

const ACCENTS = {
  sage:   { hue: "150", c: "0.06", name: "Sage" },
  gold:   { hue: "75",  c: "0.09", name: "Gold" },
  ink:    { hue: "260", c: "0.05", name: "Ink"  }
};

/* ---------- tiny inline icons (stroke only, no decorative SVG) ---------- */
const Icon = {
  arrow: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 17 17 7M9 7h8v8"/></svg>,
  chev:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 6 6 6-6 6"/></svg>,
  spark: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M18.4 5.6l-4.2 4.2M9.8 14.2l-4.2 4.2"/></svg>,
  cal:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>,
  clock: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  bars:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 20V12M12 20V4M19 20v-6"/></svg>,
  star:  (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="m12 3 2.7 5.7L21 9.6l-4.6 4.3 1.2 6.1L12 17.3 6.4 20l1.2-6.1L3 9.6l6.3-.9z"/></svg>,
  quote: (p) => <svg viewBox="0 0 100 80" fill="currentColor" {...p}><path d="M0 50c0-22 14-40 36-46v12c-12 6-20 18-20 30h20v34H0V50zm56 0c0-22 14-40 36-46v12c-12 6-20 18-20 30h20v34H56V50z"/></svg>,
  scroll:(p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 4v14m-5-5 5 5 5-5"/></svg>,
  gh:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .26.18.58.69.48A10 10 0 0 0 12 2z"/></svg>,
  li:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.55c0-1.32-.02-3.02-1.84-3.02-1.84 0-2.12 1.44-2.12 2.92V21h-4V9z"/></svg>,
  lock:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
};

/* ---------- carved corner mask (SVG) ---------- */
const Carve = ({ pos, size = 56 }) => {
  // pos: 'tl' | 'tr' | 'bl' | 'br' — concave quarter that fills the outside corner with bg
  const paths = {
    tl: "M0 0 V56 C0 25 25 0 56 0 H0 Z",
    tr: "M56 0 V56 C56 25 31 0 0 0 H56 Z",
    bl: "M0 56 V0 C0 31 25 56 56 56 H0 Z",
    br: "M56 56 V0 C56 31 31 56 0 56 H56 Z",
  };
  const place = {
    tl: { top: -size, left: 0 },
    tr: { top: -size, right: 0 },
    bl: { bottom: 0, left: -size },
    br: { bottom: 0, right: -size },
  }[pos];
  return (
    <div style={{ position: "absolute", width: size, height: size, pointerEvents: "none", ...place }}>
      <svg width="100%" height="100%" viewBox="0 0 56 56"><path d={paths[pos]} fill="var(--bg-page)"/></svg>
    </div>
  );
};

/* ---------- pill buttons ---------- */
const PrimaryPill = ({ children, ghost, small, ...rest }) => (
  <button className={`pill ${ghost ? "pill-ghost" : "pill-primary"} ${small ? "pill-sm" : ""}`} {...rest}>
    <span className="pill-icon"><Icon.arrow width="14" height="14"/></span>
    <span>{children}</span>
  </button>
);

/* ===================================================================== */
/* SECTION 1: HERO                                                        */
/* ===================================================================== */
function Hero() {
  // TODO:GSAP
  // Trigger: mount
  // Element: .hero-line (each)
  // Animation: stagger up — opacity 0→1, translateY 40→0
  // Duration: 700 each, 120 stagger
  // Ease: power3.out
  const lines = [
    "A community of",
    "future tech leaders.",
    "We develop solutions",
    "to problems you face.",
  ];
  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="hero-frame">
        {/* hero stage placeholder — TODO:GSAP 3D Earth → person → scientist sequence */}
        <div className="hero-3d-canvas" aria-hidden="true">
          {/* TODO:GSAP: Earth animation, 3D person sequence, problem → solution → future scientist flow */}
          {/* TODO:GSAP: On scroll, earth translates left, 3D person enters, problem cards appear, scientist reveal, 3 screen stack */}
          <div className="stage-stripes"/>
          <div className="stage-label">3D scene · earth → solution → scientist</div>
          <div className="stage-orb orb-a"/>
          <div className="stage-orb orb-b"/>
          <div className="stage-orb orb-c"/>
        </div>

        {/* glass nav */}
        <nav className="nav" aria-label="Main">
          <div className="brand">
            <span className="brand-mark">◐</span>
            <span className="brand-word">Codemo</span>
          </div>
          <ul className="nav-links">
            <li>Community</li>
            <li>Events <Icon.chev width="13" height="13"/></li>
            <li>eLearn</li>
            <li>Articles <Icon.chev width="13" height="13"/></li>
          </ul>
          <div className="nav-cta">
            <PrimaryPill small>Join Discord</PrimaryPill>
          </div>
        </nav>

        {/* center copy */}
        <div className="hero-copy">
          <div className="hero-badge">
            <Icon.spark width="14" height="14"/>
            <span>Open community · AI · cybersec · software</span>
          </div>
          <h1 className="hero-title">
            {lines.map((l, i) => (
              <span key={i} className="hero-line" style={{ "--i": i }}>{l}</span>
            ))}
          </h1>
          <p className="hero-sub">
            Codemo Teams is the merger of Code Motion, Code Motivation and Code Movement.
            Structured Discord channels, real tutorials and career support — money is not a problem over career.
          </p>
          <div className="hero-actions">
            <PrimaryPill>Explore community</PrimaryPill>
            <PrimaryPill ghost>View events</PrimaryPill>
          </div>
        </div>

        {/* corner card — community count (bottom-left) */}
        <aside className="glass-card card-bl">
          <div>
            <div className="kpi">12.4K</div>
            <div className="kpi-label">Active members</div>
          </div>
          <button className="white-pill">
            <span className="white-pill-icon"><Icon.arrow width="13" height="13"/></span>
            <span>Open Discord</span>
          </button>
        </aside>

        {/* carved corner — documentation (bottom-right) */}
        <div className="carved carved-br">
          <Carve pos="tr" size={56}/>
          <Carve pos="bl" size={56}/>
          <div className="carved-icon"><Icon.arrow width="22" height="22"/></div>
          <div className="carved-text">
            <div className="carved-title">Tutorials</div>
            <div className="carved-sub">Library <Icon.chev width="11" height="11"/></div>
          </div>
        </div>

        {/* scroll hint */}
        <button className="scroll-hint" onClick={() => document.querySelector('#section-stats').scrollIntoView({behavior:'smooth'})} aria-label="Scroll">
          <Icon.scroll width="18" height="18"/>
        </button>
      </div>
    </section>
  );
}

/* ===================================================================== */
/* SECTION 2: STATS STRIP (between hero + events)                         */
/* ===================================================================== */
function Stats() {
  const stats = [
    ["12.4K", "Members"],
    ["340+",  "Tutorials shipped"],
    ["48",    "Live channels"],
    ["96%",   "Land their first role"],
  ];
  return (
    <section id="section-stats" className="stats" data-screen-label="02 Stats">
      <div className="stats-shell">
        {stats.map(([n, l], i) => (
          <div key={i} className="stat">
            <div className="stat-n">{n}</div>
            <div className="stat-l">{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===================================================================== */
/* SECTION 3: EVENTS HIGHLIGHTS                                           */
/* ===================================================================== */
const SAMPLE_EVENTS = [
  { id:"e1", title:"Cybersec Live: Threat modelling for indie devs", description:"A practitioner walkthrough — STRIDE, attack trees, and where most teams over-engineer.", date:"Wed 21 May · 18:00 BST", type:"Workshop", seats_remaining:7 },
  { id:"e2", title:"AI agents from zero — build a research bot", description:"Tools, traces and evals. We ship a working agent in two hours, repo provided.", date:"Sat 24 May · 15:00 BST", type:"Hands-on", seats_remaining:42 },
  { id:"e3", title:"Career clinic: from junior to staff", description:"Mock reviews, salary calibration, and how to write a promo doc that lands.", date:"Tue 03 Jun · 19:00 BST", type:"Career", seats_remaining:18 },
];

function EventCard({ e }) {
  return (
    <article className="evt-card">
      {/* TODO:GSAP — Trigger: scroll-enter; Element: .evt-card; Animation: stagger up 24px + opacity; Duration: 600; Ease: power2.out */}
      <div className="evt-banner">
        <div className="banner-stripes"/>
        <span className="evt-type">{e.type}</span>
        <span className="banner-tag">event banner</span>
      </div>
      <h3 className="evt-title">{e.title}</h3>
      <p className="evt-desc">{e.description}</p>
      <div className="evt-row"><Icon.cal width="14" height="14"/><span>{e.date}</span></div>
      {e.seats_remaining < 10 && <div className="evt-warn">Only {e.seats_remaining} seats left</div>}
      <div className="evt-foot">
        <button className="ghost-pill">View event <Icon.chev width="12" height="12"/></button>
      </div>
    </article>
  );
}

function EventsHighlights() {
  return (
    <section className="events" data-screen-label="03 Events">
      <header className="sec-head">
        <div>
          <div className="eyebrow">Upcoming</div>
          <h2>What's happening this month</h2>
        </div>
        <a className="ghost-pill big">See all events <Icon.chev width="13" height="13"/></a>
      </header>
      <div className="card-grid">
        {SAMPLE_EVENTS.map(e => <EventCard key={e.id} e={e}/>)}
      </div>
    </section>
  );
}

/* ===================================================================== */
/* SECTION 4: COURSE HIGHLIGHTS                                           */
/* ===================================================================== */
const SAMPLE_COURSES = [
  { id:"c1", title:"Foundations of applied AI", level:"beginner",     instructor:"Aanya Rao",       duration:"8h", enrolled:1240 },
  { id:"c2", title:"Defensive web security",     level:"intermediate", instructor:"Marcus Lefèvre",  duration:"12h", enrolled:860 },
  { id:"c3", title:"Designing with TypeScript",  level:"advanced",     instructor:"Priya Krishnan",  duration:"10h", enrolled:512 },
];
const LEVEL_COLOR = { beginner:"sage", intermediate:"gold", advanced:"ink" };

function CourseCard({ c }) {
  return (
    <article className="crs-card">
      {/* TODO:GSAP — same stagger pattern as events */}
      <div className="crs-thumb">
        <div className="banner-stripes"/>
        <span className="banner-tag">course thumbnail</span>
        <span className={`level level-${LEVEL_COLOR[c.level]}`}>{c.level}</span>
      </div>
      <h3 className="crs-title">{c.title}</h3>
      <div className="crs-instructor">
        <div className="avatar">{c.instructor.split(" ").map(s=>s[0]).join("")}</div>
        <span>{c.instructor}</span>
      </div>
      <div className="crs-meta">
        <span><Icon.clock width="12" height="12"/> {c.duration}</span>
        <span><Icon.bars width="12" height="12"/> {c.level}</span>
        <span>· {c.enrolled.toLocaleString()} enrolled</span>
      </div>
      <PrimaryPill small>Start learning</PrimaryPill>
    </article>
  );
}

function CourseHighlights() {
  return (
    <section className="courses" data-screen-label="04 Courses">
      <div className="courses-inner">
        <header className="sec-head">
          <div>
            <div className="eyebrow">eLearn</div>
            <h2>Learn something new this week</h2>
          </div>
          <a className="ghost-pill big">Explore all courses <Icon.chev width="13" height="13"/></a>
        </header>
        <div className="card-grid">
          {SAMPLE_COURSES.map(c => <CourseCard key={c.id} c={c}/>)}
        </div>
      </div>
    </section>
  );
}

/* ===================================================================== */
/* SECTION 5: TESTIMONIALS                                                */
/* ===================================================================== */
const SAMPLE_TESTIMONIALS = [
  { id:"t1", name:"Léa Dubois",   role:"Junior SWE · Lyon",        rating:5, content:"The Discord channels gave me a place to ask the questions I was too embarrassed to ask at work. Six months later I shipped my first prod feature." },
  { id:"t2", name:"Tomás Herrera", role:"Bootcamp grad · Madrid",   rating:5, content:"Career clinic mocks got my offer up by 22%. The reviewers were brutal in the best way." },
  { id:"t3", name:"Ifeoma Okafor", role:"Security analyst · Lagos", rating:5, content:"I came for the AI track and stayed for the cybersec community. The threat modelling workshop alone was worth a year of subs." },
];

function Testimonials() {
  return (
    <section className="testi" data-screen-label="05 Testimonials">
      <header className="sec-head sec-head-center">
        <div className="eyebrow">Reviews</div>
        <h2>What our community says</h2>
      </header>
      <div className="testi-grid">
        {SAMPLE_TESTIMONIALS.map(t => (
          <article key={t.id} className="testi-card">
            <div className="stars">
              {Array.from({length:t.rating}).map((_,i)=><Icon.star key={i} width="14" height="14"/>)}
            </div>
            <p className="testi-quote">{t.content}</p>
            <div className="testi-author">
              <div className="avatar">{t.name.split(" ").map(s=>s[0]).join("")}</div>
              <div>
                <div className="testi-name">{t.name}</div>
                <div className="testi-role">{t.role}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ===================================================================== */
/* SECTION 6: FOUNDER MESSAGE                                             */
/* ===================================================================== */
function FounderMessage() {
  return (
    <section className="founder" data-screen-label="06 Founder">
      <div className="founder-inner">
        <aside className="founder-side">
          <div className="founder-photo" aria-label="Founder portrait placeholder">
            <div className="banner-stripes"/>
            <span className="banner-tag">founder photo</span>
          </div>
          <div className="founder-name">Riccardo Conte</div>
          <div className="founder-role">Founder, Codemo Teams</div>
        </aside>
        <div className="founder-body">
          <Icon.quote className="founder-quote-mark" width="120" height="96"/>
          <p>We started Codemo because three communities — Code Motion, Code Motivation and Code Movement — kept solving the same problem in three slightly different rooms. So we tore down the walls.</p>
          <p>The mission is simple. Talent has no limits, and money should never be the gatekeeper to a career in technology. If you can show up and do the work, we'll meet you halfway with the channels, the tutorials and the people who have already walked the path.</p>
          <p>This page is just the doorway. The community lives behind it.</p>
        </div>
      </div>
    </section>
  );
}

/* ===================================================================== */
/* SECTION 7: FOOTER                                                      */
/* ===================================================================== */
function Footer() {
  return (
    <footer className="foot" data-screen-label="07 Footer">
      <div className="foot-top">
        <div className="brand">
          <span className="brand-mark">◐</span>
          <span className="brand-word">Codemo</span>
        </div>
        <ul className="foot-nav">
          <li>Home</li><li>Team</li><li>Events</li><li>Articles</li><li>eLearn</li><li>Projects</li>
        </ul>
        <div className="foot-social">
          <button aria-label="GitHub"><Icon.gh width="16" height="16"/></button>
          <button aria-label="LinkedIn"><Icon.li width="16" height="16"/></button>
        </div>
      </div>
      <div className="foot-divider"/>
      <div className="foot-bot">
        <div>© 2026 Codemo Teams. All rights reserved.</div>
        <div className="foot-legal">
          <span>Privacy Policy</span>
          <span>·</span>
          <span>Cookie Preferences</span>
          <span>·</span>
          <span>Terms</span>
        </div>
      </div>
    </footer>
  );
}

/* ===================================================================== */
/* PAGE                                                                   */
/* ===================================================================== */
function Page() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement;
    const a = ACCENTS[t.accent] || ACCENTS.sage;
    r.style.setProperty("--accent-h", a.hue);
    r.style.setProperty("--accent-c", a.c);
    r.style.setProperty("--glass-blur", `${t.glass}px`);
    r.dataset.theme = t.dark ? "dark" : "light";
  }, [t]);

  return (
    <>
      <Hero/>
      <Stats/>
      <EventsHighlights/>
      <CourseHighlights/>
      <Testimonials/>
      <FounderMessage/>
      <Footer/>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Theme">
          <TweakToggle label="Dark mode" value={t.dark} onChange={v => setTweak("dark", v)}/>
          <TweakRadio
            label="Accent"
            value={t.accent}
            onChange={v => setTweak("accent", v)}
            options={[{value:"sage",label:"Sage"},{value:"gold",label:"Gold"},{value:"ink",label:"Ink"}]}
          />
          <TweakSlider label="Glass blur" value={t.glass} min={0} max={32} step={1} onChange={v => setTweak("glass", v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<Page/>);
