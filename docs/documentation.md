# Project Documentation

**Last Updated:** 2026-05-07

## Project Overview

Codemo Teams is a collaborative ecosystem designed to unify the software development lifecycle. It provides an integrated suite of tools for project management, technical article publishing, and event coordination, aiming to streamline operations for developers and designers alike.

## Resource Directory

External resources reserved for future sprints. Full integration rules and licence guidance live in [FRONTEND.md → Future Recommendations and Free Resources](FRONTEND.md#future-recommendations-and-free-resources).

* **[RapidAPI free APIs](https://rapidapi.com/collection/list-of-free-apis)** — `[FUTURE]` catalogue of free third-party APIs for new features. Always wrap in Edge Functions.
* **[free-for.dev](https://free-for.dev/)** — `[REFERENCE]` directory of free-tier services across hosting, monitoring, CI, analytics, storage. First port of call before paying.
* **[Iconify icon sets](https://icon-sets.iconify.design/)** — `[FUTURE]` 200 000+ open-source icons. Tier 2 in the asset resolution order; verify per-set licence.

## System Map

Please refer to the detailed [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the complete system topology, Edge networking, and database federation model.

## Branch Model Summary

Two protected branches: `frontend` and `supabase`. There is no `main`. The legacy `backend` and `shared` branches were removed (See [ADR-0008](adr/0008-drop-railway-supabase-only.md)). See [BRANCHING.md](BRANCHING.md) for workflows.

## Tech Stack Registry

* **Frontend:** Next.js 16, TailwindCSS, Zustand, TanStack Query, React Hook Form, Zod, `@supabase/ssr`.
* **Backend (Supabase only):** Postgres 15, Supabase Auth (Argon2id), Storage, Realtime, Edge Functions (Deno + TypeScript).
* **Edge:** Cloudflare (DNS, SSL Full Strict, WAF, Turnstile).
* **Hosting:** Vercel (frontend). Supabase hosted (backend).
* **Email:** Self-hosted Postal SMTP on Oracle Cloud Always-Free VM, called from the `send-email` Edge Function (See ADR-0009).

## Asset Inventory

This inventory covers **local assets only** sourced from `Codemo Assets/Codemo Website Elements 1.0`. Assets pulled from Tier 2 libraries (Lucide, Iconify, Phosphor, etc.) are documented per-component in the Component Inventory below under the "Icon Source" column. See [FRONTEND.md → Icon and Asset Resolution Strategy](FRONTEND.md#icon-and-asset-resolution-strategy) for the binding tier system.

| Asset | Location Used |
|-------|---------------|
| Logo (Circular "eye" mark) | Navbar, Auth pages |

*(This table must be updated with every new local asset introduced.)*

## Component Inventory

| Component | Path | Icon Source | Notes |
|---|---|---|---|
| `Button` | `components/ui/Button.tsx` | n/a | `primary` / `secondary` / `ghost` variants, loading state |
| `Chip` | `components/ui/Chip.tsx` | n/a | Single-select pill chip used by signup/edit forms |
| `Drawer` | `components/ui/Drawer.tsx` | Inline SVG | Right-anchored slide-over with focus trap, ESC, body scroll lock |
| `SocialButton` | `components/ui/SocialButton.tsx` | Inline SVG | OAuth provider button (Google/Microsoft/GitHub) |
| `EditProfileDrawer` | `components/profile/EditProfileDrawer.tsx` | Local | Profile edit form rendered inside `Drawer` |
| `SettingsDrawer` | `components/profile/SettingsDrawer.tsx` | Local | Settings menu + change-password sub-section |
| `ProfileDropdown` | `components/layout/ProfileDropdown.tsx` | Local | Authenticated avatar dropdown |
| `SignupDropdown` | `components/layout/SignupDropdown.tsx` | Inline SVG | Unauthenticated dropdown |
| `Navbar` / `Sidebar` / `BottomNav` / `CookiesBanner` / `Footer` | `components/layout/` | Local | App shell |
| `Hero`, `EventsHighlights`, `CourseHighlights`, `Testimonials`, `FounderMessage` | `components/home/` | Local | Home page sections (server components, Suspense streaming, see [HOME-PAGE.md](HOME-PAGE.md)) |
| `EventsTabs` | `components/events/EventsTabs.tsx` | Inline SVG | Tab switcher for Calendar / Upcoming / Past on `/events` |
| `EventCalendar` | `components/events/EventCalendar.tsx` | Inline SVG | Custom Codemo-themed month grid with category dots, day-detail panel, RRULE expansion via `rrule` |
| `EventsTable` | `components/events/EventsTable.tsx` | Inline SVG | Pageable grid (10 per page) used by Upcoming + Past tabs |
| `EventDetailPopup` | `components/events/EventDetailPopup.tsx` | Inline SVG | Centred modal with banner, badges, description, register / add-to-calendar / cert download |
| `JoinEventButton` | `components/events/JoinEventButton.tsx` | Inline SVG | Inserts into `event_registrations`; redirects to login when guest |
| `AddToCalendar` | `components/events/AddToCalendar.tsx` | Inline SVG | Dropdown: Google / Apple (.ics) / Outlook / Other (.ics) — uses `ics` for client-side .ics generation |
| `EventBadges` | `components/events/EventBadges.tsx` | n/a | `CategoryBadge`, `ModeBadge`, `StatusBadge`, date/duration formatters |
| `EventForm` (admin) | `components/admin/EventForm.tsx` | Inline SVG | Single-form admin event create/edit with banner + cert template upload |
| `AttendanceManager` (admin) | `components/admin/AttendanceManager.tsx` | Inline SVG | Filterable attendance table with single + bulk cert issuance |

**Icon Source column values:** `Local` (Codemo Assets Tier 1) · `Lucide` · `Heroicons` · `Phosphor` · `Tabler` · `Iconify` · `Inline SVG` (Tier 3) · `Other` (document the library).

*(Update this table with every new shared component. When adding from a Tier 2 library, document the choice with `// Icon: Lucide/{Name} — local asset unavailable` in the source.)*

## Layout Primitives

* **Navbar:** Fixed height, responsive width.
* **Sidebar:** Expandable/collapsible (desktop default: expanded).
* **Bot Dock:** Non-textual icon-based dock.
* **Profile Dropdown:** Standardised dimensions and positioning.

## Routing Map

| Route | Auth | Notes |
|---|---|---|
| `/` | optional | Home (app shell). Hero, events, courses, testimonials, founder, footer. See [HOME-PAGE.md](HOME-PAGE.md). |
| `/team`, `/articles`, `/elearn`, `/projects` | required | Feature stubs |
| `/events` | optional | Calendar / Upcoming / Past tabs. Calendar tab supports recurring events. Detail popup handles join + add-to-calendar + cert download. |
| `/admin/events` | admin | Event list (every status) |
| `/admin/events/new` | admin | Create event form |
| `/admin/events/[id]/edit` | admin | Edit event form |
| `/admin/events/[id]/attendance` | admin | Mark attendance, issue + email certificates |
| `/profile` | required | Profile card |
| `/profile/edit` | required | Edit profile (still available as a dedicated page; desktop now opens it as a drawer) |
| `/profile/settings` | required | Settings hub |
| `/profile/settings/password` | required | In-session password change |
| `/auth` | guest | Email entry |
| `/auth/login` | guest | Login |
| `/auth/signup`, `/signup/details`, `/signup/career`, `/signup/verify`, `/signup/success` | guest | Signup flow |
| `/auth/onboarding` | required, profile-incomplete | Forced for OAuth users with missing metadata |
| `/auth/reset-password` | guest | Forgot-password request |
| `/auth/update-password` | recovery session | New password after recovery email |
| `/auth/callback` | n/a | OAuth + email-confirm + recovery handler |

Route guards live in `frontend/proxy.ts` and the profile-completeness check.

## State Management

* **Zustand stores:**
  * `stores/sidebar.ts` — sidebar expansion (key `codemo.sidebar.expanded`).
  * `stores/theme.ts` — `override: 'system' | 'light' | 'dark'` (key `codemo.theme.override`). Mobile always tracks system; desktop respects override.
  * `stores/signup.ts` — multi-step signup draft (sessionStorage key `codemo.signup.draft`).
* **Persistence keys:** all prefixed `codemo.<feature>.<key>`.
* **Server state:** Supabase data fetched via `@supabase/ssr` clients. TanStack Query is wired up but used sparingly — most reads happen through Server Components.

## Feature Inventory

* **Built:** Authentication, User Profiles.
* **In Progress:** Dashboard layout, component library.
* **Planned:** Articles engine, Event coordination, Project boards.

## Outstanding Technical Debt

* None currently recorded. New debt must be documented here with a corresponding tracking issue.

## Documentation Pointers

* **[ARCHITECTURE.md](docs/ARCHITECTURE.md):** How do the pieces of the system communicate?
* **[REPOSITORY-RULES.md](docs/REPOSITORY-RULES.md):** What are the rules for pushing code?
* **[BRANCHING.md](docs/BRANCHING.md):** How do I start a feature or hotfix?
* **[DEPLOYMENT.md](docs/DEPLOYMENT.md):** How does code get to production?
* **[FRONTEND.md](docs/FRONTEND.md):** What are the frontend conventions?
* **[BACKEND.md](BACKEND.md):** Deprecated. Redirects to SUPABASE.md.
* **[SUPABASE.md](SUPABASE.md):** Schema, RLS, Edge Functions inventory, Dashboard config.
* **[DATABASE-RULES.md](DATABASE-RULES.md):** Query and transaction constraints.
* **[API-RULES.md](API-RULES.md):** Edge Function envelope and CORS rules.
* **[SECURITY.md](docs/SECURITY.md):** How do we handle authentication, cryptography, and vulnerabilities?
* **[ENVIRONMENT.md](docs/ENVIRONMENT.md):** What environment variables do I need?
* **[DESIGN-TOKENS.md](docs/DESIGN-TOKENS.md):** What are the exact colours and spacing rules?
* **[TESTING.md](docs/TESTING.md):** How do I write and run tests?
* **[CONTRIBUTING.md](docs/CONTRIBUTING.md):** How do I submit an issue or PR?
* **[RUNBOOKS.md](docs/RUNBOOKS.md):** What do I do when something goes wrong?
* **[CHANGELOG.md](docs/CHANGELOG.md):** What changed in the latest version?

## Update Rules

1. Any new component, route, store, asset or feature must be reflected in this file in the same commit it is introduced.
2. Any breaking change must be flagged with migration notes.
3. Documentation drift is a bug, not a chore.
