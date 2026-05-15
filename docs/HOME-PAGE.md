# Home Page

**Last Updated:** 2026-05-09

The home page is the public landing surface at `/`. It renders inside the existing app shell (Navbar + Sidebar + BotDock) — those layout components are **locked** and must not be modified by home-page work.

## Sections Map

| Order | Section | Component | Path |
|---|---|---|---|
| 1 | Hero | `Hero` | [`frontend/components/home/Hero.tsx`](../frontend/components/home/Hero.tsx) |
| 2 | Events Highlights | `EventsHighlights` | [`frontend/components/home/EventsHighlights.tsx`](../frontend/components/home/EventsHighlights.tsx) |
| 3 | Course Highlights | `CourseHighlights` | [`frontend/components/home/CourseHighlights.tsx`](../frontend/components/home/CourseHighlights.tsx) |
| 4 | Testimonials | `Testimonials` | [`frontend/components/home/Testimonials.tsx`](../frontend/components/home/Testimonials.tsx) |
| 5 | Founder Message | `FounderMessage` | [`frontend/components/home/FounderMessage.tsx`](../frontend/components/home/FounderMessage.tsx) |
| 6 | Footer | `Footer` | [`frontend/components/layout/Footer.tsx`](../frontend/components/layout/Footer.tsx) |

Page assembly: [`frontend/app/(app)/page.tsx`](../frontend/app/(app)/page.tsx). Each data-driven section is a server component fetched in parallel via React Suspense, with section-specific revalidation.

## Creative Motif

Two consistent visual cues run through every section:

1. **Diagonal blue accent stripe** — a 4 px Codemo-blue line cuts across the top-left corner of every `home-card`, breaching the rounded edge. Code in `globals.css` under `.home-card::before`. Distinct from glassy hover treatments elsewhere in the app.
2. **Editorial mono eyebrows** — every section header is preceded by a `// keyword` label in monospace. Reinforces the tech-community character without falling into generic "developer hero" tropes.

Asymmetry is preferred over symmetric hero-image-right templates. Hero is 60/40 with text dominant, the 3D scene is a deliberate placeholder. Course highlights sit on a `home-stripe-surface` band to break the rhythm. Testimonials are centred, founder message is left-photo / right-prose with a faded oversize quote mark.

## Data Sources

All reads use the cookie-less `createPublicClient()` from [`frontend/lib/supabase/public.ts`](../frontend/lib/supabase/public.ts) so they can be wrapped in `unstable_cache`. RLS on each table allows public SELECT only on published/approved rows.

| Section | Table | Filter | Cache TTL | Tags |
|---|---|---|---|---|
| Events | `public.events` | `status = 'published'` AND `starts_at >= now()`, `limit 3`, sorted ascending | 60s | `events` |
| Courses | `public.courses` | `status = 'published'` | 300s | `courses` |
| Testimonials | `public.testimonials` | `approved = true` | 600s | `testimonials` |
| Founder | `public.site_content` | `key = 'founder_message'` | 3600s | `site_content` |

To force a refresh after editing data, call `revalidateTag('events' \| 'courses' \| ...)` from a Route Handler or admin action. Tag names are stable across deploys.

> **Events auto-population.** The `EventsHighlights` section reads from the same `public.events` table the admin panel writes to. Any event with `status = 'published'` and `starts_at` in the future is eligible. The query orders by nearest start date and takes the first three. No manual curation, no separate "featured" flag — the admin simply publishes an event and the home page surfaces it within the 60-second cache window. See [docs/ADMIN.md → Event Management](ADMIN.md#event-management).

## Skeleton, Empty and Error States

* **Skeleton** — every section that fetches exposes a sibling skeleton with identical card dimensions to keep CLS at 0. Wrapped in `<Suspense fallback={<Skeleton />}>` at the page level.
* **Empty** — events and courses render an inline empty card with a "Browse all" link. Testimonials hide the entire section (no header rendered either) when no rows are approved. Founder message falls back to a hardcoded paragraph triplet (defined in `FounderMessage.tsx`'s `FALLBACK`).
* **Error** — Supabase errors are caught inside the cached fetch wrapper and logged via `console.warn`. The fetch returns an empty array, which routes the section into its empty-state branch. No crash, no toast, no user-visible error message.

## SLIDE Animation Map

GSAP + ScrollTrigger drive all home-page animations. They are imported only via `@/lib/gsap/setup` so plugin registration happens exactly once and the `#main-content` scroller is bound by default.

Every animation block is preceded by a standardised comment header:

```ts
// ─────────────────────────────────────
// SLIDE [N]: [Section Name] — [Animation Type]
// Trigger: [mount | scroll-enter | hover | click]
// Element: [ref or selector]
// Motion: [plain English]
// Duration: [s]
// Ease: [easing]
// ─────────────────────────────────────
```

| # | Section | File | Trigger | Element | Motion |
|---|---|---|---|---|---|
| 1 | Hero text stagger | `Hero.tsx` | mount | `.hero-line × 4 + eyebrow` | fade-up y:40 → 0, stagger 0.15s, 0.8s each, power3.out |
| 2 | Hero CTA | `Hero.tsx` | mount (after text) | `.hero-cta` | fade-up y:20 → 0, 0.6s, power2.out |
| 3 | Hero Earth column | `Hero.tsx` | scroll, top top → bottom top | `.hero-earth-column` | translateX 0 → -15%, scrub:true. Pairs with Three.js camera lerp inside `EarthScene` |
| 4 | Events cards | `EventsHighlights.tsx` (via `RevealOnScroll`) | scroll, top 75% | `.event-card` | fade-up y:30, stagger 0.12s, 0.7s, power2.out, once |
| 5 | Course cards | `CourseHighlights.tsx` (via `RevealOnScroll`) | scroll, top 75% | `.course-card` | same as above |
| 6 | Testimonials | `Testimonials.tsx` (via `RevealOnScroll`) | scroll, top 75% | `.testi-card` | same as above |
| 7 | Founder photo | `FounderMessage.tsx` (via `FounderReveal`) | scroll, top 70% | `.founder-photo` | translateX -40 → 0 + opacity, 0.9s, power3.out, once |
| 8 | Founder text | `FounderMessage.tsx` (via `FounderReveal`) | scroll, top 70% (timeline) | `.founder-message` | translateX 40 → 0 + opacity, 0.9s, power3.out, once |

Footer is intentionally not a slide — it sits at the page bottom without a reveal. Adding one creates an awkward "the page isn't done yet" pause.

### Failure modes addressed

| Spec failure | Fix in this implementation |
|---|---|
| ScrollTrigger not registered | `lib/gsap/setup.ts` registers once at module load behind a `typeof window` guard |
| Triggers firing on wrong element | Every `gsap.to(...)` is scoped to a `useRef`-bound element via `gsap.context(scope)` |
| SSR conflict | All animation hooks live in `'use client'` files inside `useEffect` |
| Missing `ScrollTrigger.refresh()` after layout | Hero and `FounderReveal` schedule a `refresh()` 200 ms after mount; `RevealOnScroll` calls it inline |
| Conflicting `overflow:hidden` | `body` keeps `overflow:hidden` (it must, for the app shell) — every ScrollTrigger uses `scroller: '#main-content'` instead of window |
| Initial CSS state missing | `gsap.set(target, { opacity:0, y:N })` runs synchronously inside the same effect as the timeline so children never flash visible |
| Cleanup leak on hot reload | Every effect returns `ctx.revert()` to kill the spawned tweens |

## NASA Earth Globe (Hero, right column)

The Hero's right column renders a full Three.js NASA Earth via `<EarthRenderer>`. Implementation lives in `frontend/components/home/three/`:

| File | Role |
|---|---|
| `EarthRenderer.tsx` | Performance-aware switch. Picks `EarthGlobe` or `NasaEarthEmbed` per device tier + reduced-motion + texture availability. |
| `EarthGlobe.tsx` | R3F `<Canvas>` with `useEarthScroll` ref and `<EarthScene>` inside `<Suspense>`. Lazy-loaded via `next/dynamic` with `ssr:false`. |
| `EarthScene.tsx` | Inside the Canvas. Earth + clouds + atmosphere + 4 000 stars + Bloom. Scroll-driven camera lerp. |
| `useEarthScroll.ts` | Subscribes to `#main-content` scroll, writes 0→1 progress to a ref read inside `useFrame`. |
| `NasaEarthEmbed.tsx` | iframe to `https://eyes.nasa.gov/apps/solar-system/#/earth`. Consent-gated via `localStorage('codemo.cookies.accepted')`. |

### Texture pipeline

NASA textures are public domain but large. They are NOT committed:

* Source: [`frontend/scripts/download-nasa-textures.sh`](../frontend/scripts/download-nasa-textures.sh) — downloads daymap, normal map, specular map, clouds.
* Output: `frontend/public/textures/earth/` (gitignored).
* Resize: 2048 × 1024 via ImageMagick if installed; otherwise run a manual squoosh/sharp pass before commit. Total budget < 6 MB combined.
* CI/build: run the script before `pnpm build` (see [DEPLOYMENT.md](DEPLOYMENT.md)).

### Tier selection

`EarthRenderer` chooses the renderer client-side based on:

1. `prefers-reduced-motion` → iframe
2. `navigator.hardwareConcurrency < 4 || navigator.deviceMemory < 4` → iframe
3. `HEAD /textures/earth/earth_daymap.jpg` returns non-2xx → iframe
4. otherwise → Three.js `EarthGlobe`

The selection is held until both probes resolve (no flash-of-wrong-renderer).

### Future enhancements (deferred)

The original brief described a multi-stage scroll narrative (Earth → person → scientist). The current implementation handles stage 1 (Earth + scroll-driven camera). Stages 2–3 (3D figure, scene transitions) are deferred — the camera/opacity scrolling here is the foundation; sprite-based or model-loaded figures can be layered on without restructuring.

## Performance & Accessibility

* All images via `next/image` with explicit sizes. Banners 160 px / 180 px / 200 px fixed heights. `priority={true}` reserved for the hero on this page (none today, since the hero is text-only).
* `<Suspense>` boundaries split the page render — the hero and footer paint immediately; data sections stream in.
* Section headings are `<h1>` (hero) and `<h2>` (every other section). The home page has exactly one `<h1>`.
* Every interactive element has a visible focus ring (`focus-visible:ring-2 focus-visible:ring-accent-primary`).
* CSS reveal animations sit inside the `prefers-reduced-motion: reduce` block in `globals.css`.
* Scroll indicator is a real anchor link (`<a href="#home-events">`) so keyboard users can jump.

## Footer Cookie Preferences

Clicking "Cookie Preferences" in the footer dispatches the `codemo:cookies:reopen` window event. `CookiesBanner` listens for it and re-renders. This is a v1 stand-in until a dedicated `CookiePreferencesDrawer` ships — when that arrives, the Footer should be migrated to open the drawer directly via shared state.

## Locked Components

The following components are **off-limits** to home-page work:

* `frontend/components/layout/Navbar.tsx`
* `frontend/components/layout/Sidebar.tsx`
* `frontend/components/layout/BotDock.tsx`
* `frontend/components/layout/BottomNav.tsx`

Any home-page change that would require touching these must instead be raised as a separate PR with `feat(fe): nav` scope.
