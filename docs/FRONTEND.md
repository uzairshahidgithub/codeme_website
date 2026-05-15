# Frontend Architecture & Standards

**Last Updated:** 2026-05-16

## Stack

* Next.js 16 App Router with TypeScript strict mode.
* TailwindCSS 3.4+ with custom token configuration.
* Zustand for client state, TanStack Query for server data fetching.
* react-hook-form with Zod resolvers.
* `@supabase/ssr` for authentication and data access (See [ADR-0008](adr/0008-drop-railway-supabase-only.md)).
* GSAP + ScrollTrigger for all home-page animations. Imported only via `@/lib/gsap/setup` — never directly from `gsap`.
* `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` for the home-page Earth globe. Lazy-loaded via `next/dynamic` with `ssr:false`.
* Poppins font via `next/font/google` (Weights: 300, 400, 500, 600, 700, 800).

## GSAP setup module

`frontend/lib/gsap/setup.ts` is the single registration point for GSAP. It:

* Registers `ScrollTrigger` exactly once, behind a `typeof window` guard.
* Sets the default scroller to `#main-content` (the app shell scrolls inside `<main>`, not on `window`, because `body` is `overflow:hidden`).
* Exports `gsap`, `ScrollTrigger`, and a `SCROLLER_ID` constant.

Every component must `import { gsap, ScrollTrigger, SCROLLER_ID } from '@/lib/gsap/setup'`. Direct `import { gsap } from 'gsap'` calls are forbidden — they bypass the registration guard and produce duplicate-trigger bugs on hot reload.

Animation effects must:

1. Be inside `useEffect` (client-only).
2. Use `gsap.context(() => { ... }, scopeRef.current)` so cleanup is automatic.
3. Stamp initial state with `gsap.set(...)` synchronously before any tweens.
4. Return `ctx.revert()` from the effect for cleanup.
5. Respect `useReducedMotion()` — when `true`, set the final state immediately and skip the timeline.

## Directory Structure

```text
frontend/
├── app/          # Next.js route segments
├── components/   # Shared UI primitives
├── lib/          # Utilities, API client, crypto helpers
├── hooks/        # Reusable custom hooks
├── stores/       # Zustand state stores
└── public/       # Static assets
```

## Icon and Asset Resolution Strategy

This section is the binding rule for any visual asset (icon, illustration, 3D model, texture). It supersedes the previous "Codemo Assets only, no substitutions" rule. Never leave an empty slot, broken image or missing icon — always resolve via the tier system below.

### Tier 1 — Local first (always check here)

1. Look in `Codemo Assets/Codemo Website Elements 1.0/` for a matching asset.
2. If found and the format matches → use it. If the format is wrong, convert (SVG preferred, PNG fallback) and use it.
3. If not found, proceed immediately to Tier 2 — do not pause, error, or leave a placeholder.

### Tier 2 — Free open-source libraries

Resolve from open-source libraries in this priority order. Install only what you need.

**Icons** (priority order, single-library preference — if Lucide already covers the need, do not add Heroicons for one icon):

| Priority | Library | Install | Import | Notes |
|---|---|---|---|---|
| a | Lucide React | `pnpm --filter frontend add lucide-react` | `import { IconName } from 'lucide-react'` | MIT, tree-shakeable, default `size={20} strokeWidth={1.5}`, colour via `currentColor` |
| b | Heroicons | `pnpm --filter frontend add @heroicons/react` | `import { IconName } from '@heroicons/react/24/outline'` | MIT, Tailwind team, solid + outline variants |
| c | Phosphor | `pnpm --filter frontend add @phosphor-icons/react` | `import { IconName } from '@phosphor-icons/react'` | MIT, multiple weights — use `weight="light"` for Codemo aesthetic consistency |
| d | Tabler | `pnpm --filter frontend add @tabler/icons-react` | `import { IconName } from '@tabler/icons-react'` | MIT, 4000+ icons, stroke-based |

**3D assets:**
1. PMND Market — <https://market.pmnd.rs> (R3F-optimised GLB)
2. Poly Pizza — <https://poly.pizza> (CC0, no attribution)
3. Sketchfab free tier (CC Attribution) — download GLB
4. Kenney Assets — <https://kenney.nl> (CC0, convert to GLB via Blender)

**Illustrations:**
1. unDraw — <https://undraw.co> (MIT, set primary colour to `#2D7FF9` before export)
2. Storyset — <https://storyset.com> (Freepik licence, customise to dark background)
3. Humaaans — <https://humaaans.com> (CC BY 4.0, mix-and-match)

**Textures:**
1. NASA Visible Earth — <https://visibleearth.nasa.gov> (public domain)
2. Poly Haven — <https://polyhaven.com> (CC0, PBR)
3. ambientCG — <https://ambientcg.com> (CC0)

### Tier 3 — Generate or compose (last resort)

If Tier 1 and Tier 2 both fail:
1. Compose from Tier 2 primitives (combine existing icons, overlay shapes).
2. Build inline SVG from scratch matching Codemo visual language.
3. Raise a design ticket for permanent inclusion in Codemo Assets.

### Theme compliance (mandatory on every external asset)

Icons from external libs:
* `size`: 16px inline · 20px rows · 24px sidebar / buttons · 28px hero
* `colour`: ALWAYS via `currentColor` or a CSS variable. Never hardcode hex.
* `strokeWidth`: 1.5 for Lucide / Heroicons outline (matches Codemo weight)
* Pass colour via Tailwind / CSS class on the parent or the icon, never an inline `style`.
* Example: `<Home size={24} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />`. Active state: `className="text-[var(--accent-primary)]"`.

SVG assets from external sources:
* Strip hardcoded `fill` / `stroke` from the SVG source.
* Replace with `fill="currentColor"` or `fill="var(--token-name)"`.
* Wrap in a sized container with explicit width and height.
* Test in both dark and light theme before committing.

Illustrations:
* unDraw: set primary colour to `#2D7FF9` (`var(--accent-primary)`) before export.
* Storyset: customise to match dark background, remove white backgrounds.
* Scale to fit container — never fixed pixel dimensions.

3D assets:
* Apply Codemo lighting rig: `AmbientLight 0.4`, `DirectionalLight` (sun), `PointLight #2D7FF9` (rim).
* Canvas background transparent — page background shows through.
* Postprocessing Bloom: `luminanceThreshold 0.2 intensity 0.4`.

### Dependency management for external libs

Before adding any new icon / asset library:
1. **Licence check:** MIT, CC0, CC Attribution, Apache 2.0 = safe. GPL = flag for review.
2. **Bundle size:** Lucide and Phosphor are tree-shakeable — only the imported icons are bundled. Run `pnpm --filter frontend build` and check the bundle report. An icon library must not add more than 20 KB gzipped to the initial bundle.
3. **Single-library preference:** if Lucide is already installed use Lucide. Do not add Heroicons for one icon.
4. **Document on first introduction:** add the new lib to this section and to `docs/ENVIRONMENT.md` expected `pnpm --filter frontend list` output.

### Auto-detection logic (model behaviour)

When implementing any component requiring an icon or asset:
1. Read the component context (sidebar nav, button, card, hero, popup).
2. Scan `Codemo Assets/Codemo Website Elements 1.0/` for a matching filename.
3. If found → use local. If not → proceed immediately to step 4.
4. Identify the semantic meaning (e.g. "calendar", "user", "lock", "star").
5. If Lucide React is in `package.json`, import from Lucide.
6. If Lucide is not installed, add it: `pnpm --filter frontend add lucide-react`.
7. Import the specific icon by semantic name and apply the styling rules above.
8. Document the choice in a code comment: `// Icon: Lucide/{Name} — local asset unavailable`.
9. Continue building. Never pause for asset resolution.

## Performance Budgets

* **LCP (Largest Contentful Paint):** < 2.5s on 4G mid-tier mobile.
* **INP (Interaction to Next Paint):** < 200ms.
* **CLS (Cumulative Layout Shift):** < 0.1.
* **Initial JS Bundle:** < 170KB gzipped.
* **Lighthouse Targets:** Performance 90+, Accessibility 95+, Best Practices 95+, SEO 90+.

## Accessibility (WCAG 2.2 AA Mandatory)

* **Semantic HTML First:** Always prefer native elements.
* **Keyboard Navigation:** Every interactive element must be reachable and usable via keyboard.
* **Focus States:** Visible focus rings and skip links are required.
* **Colour Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text.
* **Motion:** Respect `prefers-reduced-motion` media queries.
* **Screen Reader Testing:** Verify complex components with NVDA and VoiceOver.

## State Management Rules

* **Prop Drilling:** Maximum two levels deep. If deeper, lift state to Context or a Zustand store.
* **Local Storage:** Keys must be prefixed with `codemo.<feature>.<key>`.
* **Session Storage:** Strictly for in-flow drafts (e.g., preserving signup step data).

## Data Access Pattern

All data access goes through Supabase — there is no separate API server (see [ADR-0008](adr/0008-drop-railway-supabase-only.md)).

| Context | Client | Location |
|---|---|---|
| Server Components / Route Handlers | `createClient()` from `@/lib/supabase/server` | Cookie-based session, full RLS |
| Client Components | `createClient()` from `@/lib/supabase/client` | Cookie-based session, full RLS |
| Public cached queries (no auth) | `createPublicClient()` from `@/lib/supabase/public` | Anon key only, safe inside `unstable_cache` |
| Admin Edge Functions | Service role key via Supabase Edge Function secrets | Never on the frontend |

**Rules:**
* Never import the service role key into `frontend/`. It belongs exclusively in Edge Functions.
* Never call `process.env.SUPABASE_SERVICE_ROLE_KEY` from any file under `frontend/`.
* Use `unstable_cache` on all public server-side queries. Set TTL per data volatility: events 60s, courses 300s, testimonials 600s, founder message 3600s.
* Mutations from Client Components call Next.js Route Handlers under `app/api/`. Route Handlers use the server client (cookie session) so RLS applies automatically.
* All sensitive route handlers validate the incoming body manually (type guard pattern) — Zod schemas for shared contracts live in `lib/schemas/`.

## Future Recommendations and Free Resources

This section catalogues external resources reserved for future Codemo Teams sprints. Items tagged `[FUTURE]` are not yet adopted and must not be pulled in without a sprint ticket. Items tagged `[REFERENCE]` are ongoing lookups for sprint planning.

### 1. Free API Integrations (Future Features) `[FUTURE]`

* **Source:** <https://rapidapi.com/collection/list-of-free-apis>
* **Purpose:** curated catalogue of free third-party APIs for future Codemo feature expansion.
* **Usage context:** when a new feature requires external data — weather, maps, social, news, finance, sports, education and similar.
* **Integration rule:** every third-party API call MUST be wrapped inside a Supabase Edge Function. Never call from the browser. This hides API keys, controls per-IP rate limits, gives us a single point to swap providers, and keeps CORS clean.
* **Licence rule:** verify each API's terms before integration. Look specifically for free-tier request limits, attribution requirements and commercial-use restrictions.
* **Pre-adoption evaluation checklist:**
  1. Free-tier monthly request limit
  2. API key required (store in Edge Function secrets only, never in `NEXT_PUBLIC_*`)
  3. Response format (JSON preferred)
  4. Rate-limit headers exposed (`X-RateLimit-*`)
  5. Published SLA and uptime history
  6. GDPR compliance if EU user data is involved

### 2. Free Developer Services Reference `[REFERENCE]`

* **Source:** <https://free-for.dev/>
* **Purpose:** comprehensive reference of free-tier tools across every development category. The first place to check before paying for any service.
* **Categories most relevant to Codemo Teams:**
  1. **Hosting and deployment** — alternatives to Vercel research.
  2. **DNS and CDN** — Cloudflare alternatives if free-tier limits are reached.
  3. **Email** — SMTP and transactional alternatives to self-hosted Postal if the OCI VM setup is not viable.
  4. **Monitoring and logging** — free APM and error tracking (Sentry free tier, BetterStack free tier, Highlight.io free).
  5. **CI/CD** — GitHub Actions alternatives.
  6. **Security** — vulnerability scanning, SAST tools.
  7. **Testing** — browser testing, load-testing free tiers.
  8. **Storage** — file and object storage alternatives to Supabase Storage.
  9. **Database** — backup services, database monitoring.
  10. **Analytics** — privacy-first free tiers (Plausible, Umami, Pirsch).
  11. **Communication** — team chat and status pages.
* **Usage rule:** before paying for any service, check `free-for.dev` first.
* **Update cadence:** review quarterly. Free-tier terms drift.

### 3. Iconify — Extended Icon Library (alternative aggregator) `[OPTIONAL]`

Lucide React is the primary Tier 2 icon source (see "Icon and Asset Resolution Strategy" above). Iconify is an alternative aggregator only if a specific icon set Lucide does not cover is required.

* **Source:** <https://icon-sets.iconify.design/>
* **Purpose:** 200 000+ open-source icons across 150+ sets behind one API.
* **Licence:** each icon set carries its own licence — verify per set. Safe sets (MIT / CC0 / Apache): Material Design Icons, Tabler Icons, Phosphor, Carbon, Fluent UI, Bootstrap Icons, Feather, Remix Icon.
* **Integration:**
  ```bash
  pnpm --filter frontend add @iconify/react @iconify-icons/<set-name>
  ```
  ```tsx
  import { Icon } from '@iconify/react'
  <Icon icon="lucide:home" width={24} className="text-[var(--text-tertiary)]" />
  ```
* **Bundle warning:** never import all of `@iconify/json` (~50 MB). Always pull individual set packages.
* **Theme compliance:** colour via `currentColor` or `var(--token)`; size 16 / 20 / 24 / 28 px to match context; consistent stroke width.

The binding tier system is documented under [Icon and Asset Resolution Strategy](#icon-and-asset-resolution-strategy). The previous "Codemo Assets only" rule is revoked.
