# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/) via automated branching logic.

## [Unreleased]

### Changed
- **Refined home page aesthetic.** Stripped editorial `// keyword` mono eyebrows from every section (Hero, Events, Courses, Testimonials, Founder, Events page, admin headers). The `home-mono-eyebrow` utility now renders as a clean uppercase label with a subtle accent rule. Removed the diagonal blue stripe that broke out of `home-card` corners; replaced banner-stripe placeholder with a soft radial gradient. Lighter card transitions (320 ms cubic-bezier).
- **Improved Events Calendar UI.** Two-column layout (calendar + selected-day panel) with refined day cells (aspect-ratio square, larger 14 px radius, subtle hover/today/selected states), category legend strip, "Today" jump button, paginated header that surfaces the year separately. Day-detail rows now show a category-coloured leading bar and location alongside time.
- **Admin auth — verification temporarily disabled.** `lib/admin/auth.ts` and `/admin/auth` no longer enforce role claim or MFA AAL2 — any signed-in user reaches the dashboard. The original gates are commented in place under `// RESTORE` markers and tracked in `docs/ADMIN.md → Temporary state`. Remove this bypass before public exposure.

### Added
- **Smooth interconnected scroll** across the entire app shell. New `SmoothScrollProvider` wires `lenis@1.3.x` to the `#main-content` scroller with reduced-motion bypass and a GSAP-ticker bridge so existing `ScrollTrigger` animations stay in lockstep with eased scroll.
- **Local 3D Earth replaces the NASA iframe.** `EarthRenderer` now always uses the Three.js globe (no third-party fallback). Textures sourced from `Codemo Assets/59-earth/textures/` and copied to `frontend/public/textures/earth/` via the new `frontend/scripts/copy-earth-textures.sh` (replaces the deleted NASA download script). New PNG night-lights overlay rendered with additive blending. Reduced-motion users get a static styled disc instead of the iframe.
- **Events tab — full functionality** ([ADR-0013](adr/0013-events-calendar-ics-cert-gen.md)).
  - **Schema** (`supabase/migrations/20260513000000_events_full.sql`): extends `public.events` with `mode`, `location_title`, `location_link`, `category`, `starts_at`, `ends_at`, `is_recurring`, `recurrence_rule`, `recurrence_label`, `max_attendees`, `cert_template_url`, `cert_enabled`, `created_by`. New tables `public.event_registrations` (UNIQUE on `(event_id, user_id)`) and `public.event_recurring_instances` (per-date overrides). RLS: users read+insert own registrations, admins read all + update attendance/cert fields. New Storage bucket `event-assets` (private, 10 MB, `image/* + application/pdf`) with folder-scoped read policies.
  - **Edge Functions**: `mark-attendance` (bulk attendance update), `generate-cert` (renders cert from PDF/PNG/JPEG template via `pdf-lib`, uploads to Storage, signs URL for 7 years), `send-cert-email` (Postal SMTP delivery of cert link).
  - **User events page** (`/events`): three tabs — Calendar, Upcoming, Past. `EventCalendar` is a custom Codemo-themed month grid with category dots, day-detail panel, and recurring-event expansion via `rrule`. `EventsTable` is a column grid with pagination. `EventDetailPopup` centred modal handles join, add-to-calendar (Google / Apple .ics / Outlook / Other), seats remaining, cert download.
  - **Admin event management** (`/admin/events/*`): list + create + edit + attendance pages. `EventForm` is a single scrollable form (admin is power user — no wizard) with mode toggle, native `datetime-local` duration inputs (custom calendar picker reuse tracked for next sprint), category chips, recurring toggle (Yearly / Monthly / Weekly + RRULE composer), banner upload, max attendees, optional certificate. `AttendanceManager` lists registrations with filter pills (All / Attended / Not Attended / Cert Issued) and supports per-row + bulk cert issuance.
  - **Home auto-integration**: `EventsHighlights` query updated to new schema (`starts_at`, `category`, `max_attendees`). Published events surface automatically on the home page within the 60-second cache window — no separate "featured" flag.
  - **New deps**: `rrule` (recurrence expansion in browser + calendar), `ics` (client-side .ics download), `pdf-lib` (Edge Function cert overlay).
  - **Docs**: `SUPABASE.md` events tables + Storage bucket; `ADMIN.md` event management section + new Edge Function rows; `API-RULES.md` Edge Function endpoints; `HOME-PAGE.md` auto-population note; `documentation.md` events components inventory + routing map; ADR-0013 covering the calendar / ics / cert-generation choices.

### BREAKING
- **Drop Railway. Move to Vercel + Supabase + Cloudflare** ([ADR-0008](adr/0008-drop-railway-supabase-only.md)).
  - Removed `backend/` workspace and the entire Node.js/Fastify API tier.
  - Removed `shared/` workspace.
  - Removed `backend` and `shared` branches from the remote (rules now reflect `frontend` + `supabase` only).
  - Custom auth (JWT signing, CSRF tokens, payload encryption envelope) is gone. Supabase Auth handles all authentication.
  - Multi-project Supabase federation collapsed to a single project ([ADR-0003](adr/0003-supabase-multi-project-federation.md) superseded).
  - Custom payload encryption envelope retired ([ADR-0004](adr/0004-payload-encryption-envelope.md) superseded). TLS + RLS is the security boundary for MVP.

### Added
- `supabase/` workspace: `config.toml`, initial migration with RLS policies, `seed.sql`.
- Edge Functions (Deno + TypeScript): `send-email` (Postal SMTP relay), `verify-turnstile`, `delete-account`, `export-data`.
- `public.profiles` table mirrored from `auth.users` via `handle_new_user()` trigger.
- `public.audit_log` insert-only table for all sensitive actions.
- `user-avatars` Storage bucket with per-user RLS policies.
- ADR-0008 documenting the migration.
- **Custom SMTP relay** — Supabase Auth and the `send-email` Edge Function relay through self-hosted Postal SMTP on the Oracle Cloud Always-Free VM. Removes Supabase's project-owner-only built-in SMTP restriction and the 3-emails-per-hour ceiling. See [ADR-0009](adr/0009-postal-smtp-over-resend.md).
- Branded HTML email templates checked into `supabase/email-templates/` (confirm-signup, magic-link, recovery, email-change) — applied via the Dashboard.
- `frontend/lib/email.ts` — typed helper for invoking the `send-email` Edge Function for app-level transactional sends.
- DNS record catalogue for the Postal mail server (MX, SPF, DKIM, DMARC, A, PTR) at [`smtp/dns-records.md`](../smtp/dns-records.md).

### Changed
- Frontend env vars renamed to single-project naming:
  - `NEXT_PUBLIC_SUPABASE_CORE_URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_CORE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_CORE_SERVICE_KEY` → moved exclusively to Edge Functions as `SUPABASE_SERVICE_ROLE_KEY`.
- CSP `connect-src` no longer references the retired `NEXT_PUBLIC_API_URL`.
- Inline theme-init script in `app/layout.tsx` migrated to `next/script` with `strategy="beforeInteractive"`.
- Root `package.json`: removed backend scripts, added `db:push`, `db:reset`, `db:diff`, `functions:deploy`, `functions:serve`, `supa:start/stop/status`.
- `pnpm-workspace.yaml`: now declares only `frontend`.

### Removed
- `NEXT_PUBLIC_API_URL`, all `NEXTAUTH_*`, `DATABASE_URL`, `JWT_*`, `CSRF_*`, `ENCRYPTION_KEY_*`, `ED25519_*`, `API_PRIVATE_KEY`, `PAYLOAD_PRIVATE_KEY`, `POSTMARK_*`, `RECAPTCHA_*` env vars.
- Any references to `api.codemoteam.org` (no API subdomain — Supabase serves directly).

### Documentation
- **Asset and icon resolution strategy rewritten as a three-tier system** across `docs/FRONTEND.md`, `docs/DESIGN-TOKENS.md`, `docs/CONTRIBUTING.md`, `docs/documentation.md`. The previous "Codemo Assets only, no substitutions" rule is revoked. New binding rule: Tier 1 local Codemo Assets → Tier 2 free open-source libraries (Lucide primary, then Heroicons / Phosphor / Tabler / Iconify) → Tier 3 composed or inline SVG. Never leave an empty slot. External assets must comply with Codemo theme tokens (`currentColor`, CSS variables, no hardcoded hex). Lucide React adopted as the primary icon fallback. `documentation.md` Component Inventory gains an "Icon Source" column. `DESIGN-TOKENS.md` gains an "External Asset Theme Compliance" section (icon sizing scale 16/20/24/28px, colour rules, 3D lighting rig, illustration recolouring).
- **Future recommendations and free resources** added to `docs/FRONTEND.md`: RapidAPI free-APIs collection (`[FUTURE]`), free-for.dev directory (`[REFERENCE]`), Iconify icon sets (`[OPTIONAL]` — Lucide is now the primary fallback). Cross-links from `docs/CONTRIBUTING.md` and `docs/documentation.md`.

### Added
- **Admin panel** at `/admin/*`, hidden + role-gated + MFA-enforced ([ADR-0012](adr/0012-admin-panel-supabase-rls-jwt.md), [docs/ADMIN.md](ADMIN.md)). New route group `app/admin/(panel)/*` for protected pages, `app/admin/auth/*` for sign-in / MFA setup / MFA verify. Same Vercel deployment, no separate backend.
- **Supabase role system.** `public.profiles.role` extended to `super_admin`. `custom_access_token_hook` stamps role into JWT `claims.role`. RLS policies on `events`, `courses`, `testimonials`, `articles`, `profiles`, `audit_log`, `site_content` gate admin reads/writes. `admin_stats` view + three security-definer RPCs (`get_admin_stats_secured`, `get_user_growth_30d`, `get_role_breakdown`).
- **Articles table stub** (extended in a future articles sprint) — needed by `admin_stats`.
- **Four admin Edge Functions:** `admin-promote-user` (super_admin only), `admin-ban-user`, `admin-approve-testimonial`, `admin-publish-event`. Shared `_shared/admin.ts` helper handles JWT verification, role checks, audit logging, envelope response.
- **Admin dashboard** with 4 stat cards, user-growth line chart + role-distribution donut chart (recharts), recent-audit table, quick-actions row with pending-review badge.
- **`AdminShell`** mirrors public navbar/sidebar tokens but is its own component — public Navbar/Sidebar/BotDock untouched.
- New deps: `recharts` for dashboard charts.
- Cloudflare WAF rules for admin route documented in [DEPLOYMENT.md](DEPLOYMENT.md).

### Added (earlier in this Unreleased block)
- **Home-page 3D Earth + scroll animations.** Hero right column now renders a full Three.js NASA Earth (day map, normal map, specular map, cloud layer, atmosphere glow, 4 000 stars, Bloom). New components under `frontend/components/home/three/`: `EarthRenderer`, `EarthGlobe`, `EarthScene`, `useEarthScroll`, `NasaEarthEmbed`. Performance-aware: low-end devices and reduced-motion users get the consent-gated NASA iframe instead.
- **GSAP + ScrollTrigger** wired across all home sections. Single registration point at `frontend/lib/gsap/setup.ts` (binds default scroller to `#main-content` and registers ScrollTrigger exactly once). New helpers: `frontend/components/home/RevealOnScroll.tsx` (stagger card grid wrapper), `frontend/components/home/FounderReveal.tsx` (photo-from-left / text-from-right). Eight animation slides documented end-to-end in [docs/HOME-PAGE.md](HOME-PAGE.md#slide-animation-map).
- `frontend/lib/hooks/useReducedMotion.ts` and `frontend/lib/hooks/usePerformanceDetect.ts` — gate animation cost based on user preferences and device class.
- `frontend/scripts/download-nasa-textures.sh` — public-domain NASA Earth imagery download + ImageMagick resize. `frontend/public/textures/` is gitignored; run the script once per machine and in CI before `pnpm build`.

### Changed
- **Hero rewritten.** Removed the broken sticky-slide pattern that fought the scroller. Replaced with a clean 100 vh layout: text left, Earth right, mount-time GSAP timeline (eyebrow → 4 lines → CTA), scroll-driven Earth column translation paired with the in-canvas camera lerp.
- All section reveals migrated from CSS-only `.home-reveal` (which fired on first paint regardless of viewport) to GSAP ScrollTrigger anchored to `#main-content`. Initial state stamped synchronously by `gsap.set` so children never flash visible. Removed broken CSS rule from `globals.css`.
- New deps in `frontend/package.json`: `gsap`, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@types/three` (dev).

### Added (earlier in this Unreleased block)
- **Home page** (`/`) with six sections: Hero, EventsHighlights, CourseHighlights, Testimonials, FounderMessage, Footer. Server-rendered with `<Suspense>` streaming and `unstable_cache` per section (60s / 300s / 600s / 3600s). Creative motif: diagonal blue accent stripes breaching card corners + editorial `// keyword` mono eyebrows. CSS-only reveal animations now, GSAP mount points pre-flagged for the next sprint (See [ADR-0011](adr/0011-home-page-ssr-gsap-handoff.md)).
- New tables: `public.events`, `public.testimonials`, `public.site_content`, `public.courses`. RLS default-deny with public SELECT only on published/approved rows. Founder message seeded.
- `frontend/lib/supabase/public.ts` — cookie-less anon client safe to wrap in `unstable_cache`.
- `frontend/components/layout/Footer.tsx` — echoes navbar visual language. "Cookie Preferences" link re-opens `CookiesBanner` via the new `codemo:cookies:reopen` window event.
- [docs/HOME-PAGE.md](HOME-PAGE.md) — section map, data sources, TODO:GSAP handoff contract, future 3D backlog.

### Removed
- **Discord OAuth provider.** Removed from Supabase Auth providers list, social button row, `SocialButton` component, `SignupDropdown`, the `/auth` page, the `next.config.ts` image hostname allowlist, and the `discord-icon` symbol in `public/icons.svg`. Zero `discord` references remain in the codebase.

### Changed
- **Social provider row repaired.** Active providers are now Google and Microsoft (Azure) only — GitHub also retired alongside Discord to match the ADR-0008 stated provider set. Apple deferred to v2.
- `SocialButton` redesigned per spec: 56px circle, 24px gap, background `var(--text1)`, inline Microsoft 4-square logo SVG. Recentred horizontally with `flex justify-center`.

### Temporary
- **Email confirmation disabled** until Postal SMTP is provisioned. `supabase/config.toml` sets `enable_confirmations = false` and `double_confirm_changes = false`; the signup flow skips `/auth/signup/verify` and lands directly on `/auth/signup/success`. Re-enable per the "Temporary state" callout in `docs/SUPABASE.md`.

### Email infrastructure: Resend → self-hosted Postal SMTP ([ADR-0009](adr/0009-postal-smtp-over-resend.md))
- New top-level `smtp/` workspace: `docker-compose.yml`, `postal.yml`, `Dockerfile` (override stub), `.env.example`, `dns-records.md`, `setup-guide.md`, `README.md`.
- Postal v3 + MariaDB 10.11 + Redis 7 stack runs on an Oracle Cloud Always-Free VM. Hostnames: `mail.codemoteam.org` (SMTP) and `postal.codemoteam.org` (admin UI behind nginx + Certbot).
- `supabase/functions/send-email/index.ts` now uses `denomailer` SMTPClient for authenticated submission to Postal on port 587 STARTTLS. Resend HTTPS API call removed.
- Edge Function secrets: removed `RESEND_API_KEY`. Added `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
- `supabase/.smtp.env.example` (Dashboard reference) updated to point at Postal credentials.
- DNS record catalogue covers MX, SPF, DKIM, DMARC, A, plus PTR set on the OCI VM.
- ADR-0009 documents the rationale, costs, trade-offs, and reversibility.
- Recurring email cost: £0 forever (was: free tier 3 000/mo, then metered).

## [fe-v0.2.0] - 2026-04-27
### Added
- Supabase Auth migration: replaced NextAuth + Prisma with `@supabase/ssr` client/server/admin helpers.
- OAuth providers configured (Apple deferred; requires $99/year Apple Developer account).
- `/auth/callback` route handler: exchanges PKCE code for session, detects email vs OAuth signup, routes incomplete OAuth profiles to `/auth/onboarding`.
- `/auth/onboarding` page: collects username, DOB, gender, domain, status for first-time OAuth users.
- `/auth/signup/verify` page: "check your inbox" holding screen replacing custom OTP input.
- `/auth/signup/success` page: Windows 11 animated gradient blobs with shimmer text.
- `/profile` page: full mobile/desktop profile card with avatar, details, action rows.
- `/profile/edit` page: full editable profile (display name, username with availability check, DOB, gender, domain, status). Email locked read-only.
- `/profile/settings` page: account settings hub with email lock notice.
- `/profile/settings/password` page: in-session password change via `supabase.auth.updateUser`.
- `/auth/reset-password` page: forgotten password email request via `supabase.auth.resetPasswordForEmail`.
- `/auth/update-password` page: password update after clicking recovery email link.
- Desktop ProfileDropdown: Settings row added; icons now use `Achievements (Default).svg` and `Edit Profile (Default).svg` from design assets.
- Backend `PATCH /api/v1/users/me` endpoint: Zod-validated profile updates via Supabase Admin API, audit log entry, username uniqueness check.
- Backend `requireAuth` middleware: validates Bearer token via `supabase.auth.getUser()`.

### Changed
- Theme store: now tracks `override: 'system' | 'light' | 'dark'` (key `codemo.theme.override`). Desktop manual toggle sets override; mobile always follows system preference.
- Root layout inline script: updated to read `codemo.theme.override` and apply mobile-system / desktop-override logic before first paint.
- BottomNav: all hardcoded `#212121` colours replaced with CSS variable `glass-sidebar` class.
- Sidebar tooltip: hardcoded `bg-bg-surface border-white/10` replaced with `var(--card-glass)` / `var(--border)`.
- CookiesBanner: hardcoded dark colours replaced with `var(--blue)`, `var(--chip-glass)`, `var(--border)`.
- `auth-glass-card` utility: `border` and `box-shadow` now use `var(--border)` and `var(--shadow)`.
- Proxy: added `AUTH_ROUTE_EXCEPTIONS` list so `/auth/onboarding`, `/auth/signup/success`, `/auth/update-password`, `/auth/reset-password` remain accessible when a session exists.
- Login page: pre-fills email from signup store, clears store draft on successful login; adds "Forgot password?" and "No account?" links.
- Signup step 1: email field is read-only when pre-filled from the email-check flow.

## [be-v0.2.0] - 2026-04-27
### Added
- `src/middleware/auth.ts`: Bearer token validation middleware using Supabase anon-key client.
- `src/routes/users.ts`: `PATCH /api/v1/users/me` — profile update with Zod validation, username uniqueness check, Supabase Admin API update, non-blocking audit log write.
- `@fastify/cors` registered inside `start()` to avoid CJS top-level-await issues.

## [fe-v0.1.0] - 2026-04-26
### Added
- Setup Next.js App Router.
- TailwindCSS configuration with design tokens.

## [be-v0.1.0] - 2026-04-26
### Added
- Setup Fastify backend structure.
- Supabase integration for core services.

## [shared-v0.1.0] - 2026-04-26
### Added
- Baseline Zod schemas.
