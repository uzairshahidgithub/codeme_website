# Codemo Website — Production Documentation

> **Version:** 1.0.0 | **Last updated:** 2026-04-25 | **Stack:** Next.js 16 · TypeScript · TailwindCSS 3.4 · NextAuth v5 · Prisma · PostgreSQL

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Map](#2-architecture-map)
3. [Design Tokens](#3-design-tokens)
4. [Typography Scale](#4-typography-scale)
5. [Asset Inventory](#5-asset-inventory)
6. [Component Inventory](#6-component-inventory)
7. [Layout Primitives](#7-layout-primitives)
8. [Theming System](#8-theming-system)
9. [Routing Map](#9-routing-map)
10. [State Management](#10-state-management)
11. [API Contracts](#11-api-contracts)
12. [Auth Flow](#12-auth-flow)
13. [Security Posture](#13-security-posture)
14. [Build & Deploy](#14-build--deploy)
15. [Testing Strategy](#15-testing-strategy)
16. [Changelog](#16-changelog)
17. [Future Add-on Guide](#17-future-add-on-guide)

---

## 1. Project Overview

**Codemo** is a collaborative tech community platform. The website provides authenticated access to team profiles, events, articles, eLearning, and community projects.

| Item | Value |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Language | TypeScript 5 strict mode |
| Styling | TailwindCSS 3.4 with custom token extensions |
| Auth | NextAuth v5 (credentials + Google + Apple + Microsoft) |
| Database | PostgreSQL via Prisma 5 |
| Cache / Rate-limit | Upstash Redis |
| Email | Postmark transactional |
| reCAPTCHA | Google reCAPTCHA v2 checkbox |
| State | Zustand 5 (client) + TanStack Query 5 (server) |
| Forms | react-hook-form + Zod |

**Entry points:**
- `app/layout.tsx` — Root HTML shell, Poppins font, providers
- `app/(app)/layout.tsx` — App shell (navbar + sidebar + bot dock + cookies)
- `app/auth/layout.tsx` — Auth shell (black bg, centred, footer logo)
- `proxy.ts` — Route guards + security headers

---

## 2. Architecture Map

```
app/
  layout.tsx                   Root layout — Poppins, AuthProvider, QueryProvider
  globals.css                  Tailwind directives + global resets + utility classes
  (app)/
    layout.tsx                 App shell — Navbar, Sidebar, BotDock, CookiesBanner
    page.tsx                   Home /
    team/page.tsx              /team
    events/page.tsx            /events
    articles/page.tsx          /articles
    elearn/page.tsx            /elearn
    projects/page.tsx          /projects
    profile/
      achievements/page.tsx    /profile/achievements
      edit/page.tsx            /profile/edit
  (stub)/
    layout.tsx                 Same shell as (app)
    privacy/page.tsx           /privacy
    terms/page.tsx             /terms
    contact/page.tsx           /contact
    donate/page.tsx            /donate
    join-us/page.tsx           /join-us
  auth/
    layout.tsx                 Auth shell — black bg, footer logo
    page.tsx                   /auth  — email entry
    login/page.tsx             /auth/login
    signup/
      page.tsx                 /auth/signup — step 1 (password)
      details/page.tsx         /auth/signup/details — step 2 (DOB/username/gender)
      career/page.tsx          /auth/signup/career — step 3 (domain/status)
      verify/page.tsx          /auth/signup/verify — step 4 (email code)
      success/page.tsx         /auth/signup/success — success screen
  api/
    auth/
      [...nextauth]/route.ts   NextAuth handlers (GET, POST)
      email-check/route.ts     POST — registered email check
      signup/route.ts          POST — create user after verification
      verify/route.ts          POST — confirm 6-digit code
      resend/route.ts          POST — resend verification code
      username/route.ts        GET  — ?q= availability check

components/
  layout/
    Navbar.tsx                 Top navigation bar
    Sidebar.tsx                Left sidebar (expand/collapse)
    BotDock.tsx                Fixed Jams Bot dock
    CookiesBanner.tsx          Cookie consent popup
    ProfileDropdown.tsx        Authenticated profile menu
    SignupDropdown.tsx         Unauthenticated sign-up/login panel
  providers/
    AuthProvider.tsx           NextAuth SessionProvider wrapper
    QueryProvider.tsx          TanStack QueryClientProvider wrapper
  ui/
    Button.tsx                 Primary/secondary button
    Input.tsx                  Text input with error display
    PasswordInput.tsx          Input with eye-toggle
    Chip.tsx                   Single-select pill chip
    SocialButton.tsx           OAuth provider button (Google/Apple/Microsoft)

stores/
  sidebar.ts                   Zustand — isSidebarExpanded, localStorage
  signup.ts                    Zustand — multi-step signup draft, sessionStorage
  theme.ts                     Zustand — isDark, localStorage

lib/
  auth.ts                      NextAuth config (credentials + OAuth providers)
  db.ts                        Prisma client singleton
  redis.ts                     Upstash Redis client
  rate-limit.ts                Sliding window rate limiters
  email.ts                     Postmark transactional email
  recaptcha.ts                 Google reCAPTCHA v2 server-side verify
  utils.ts                     cn() helper (clsx + tailwind-merge)
  validations/
    auth.ts                    Zod schemas for all auth forms

prisma/
  schema.prisma                User, Account, Session, VerificationToken, AuditLog

proxy.ts                       Auth guards + security headers (Next.js 16 proxy)
tailwind.config.ts             All design tokens as Tailwind theme extensions
types/
  next-auth.d.ts               Session type augmentation
```

---

## 3. Design Tokens

### Colours

| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#000000` | Page background, auth screens |
| `bg-surface` | `#1A1A1A` | Navbar, sidebar, cards |
| `bg-surface-elevated` | `#2A2A2A` | Search button, sign-up button, dropdown bg, social buttons |
| `bg-input` | `#3A3A3A` | Form inputs |
| `accent-primary` | `#2D7FF9` | CTA buttons, active icon, focus ring |
| `accent-primary-hover` | `#1F6FE5` | Button hover state |
| `text-primary` | `#FFFFFF` | Headings, active labels |
| `text-secondary` | `#D9D9D9` | Body text, nav links |
| `text-tertiary` | `#B8B8B8` | Inactive sidebar labels |
| `text-muted` | `#9E9E9E` | Placeholders, captions |
| `text-link` | `#2D7FF9` | Privacy link, resend link |
| `text-error` | `#FF5C5C` | Validation errors, logout label |
| `border-subtle` | `rgba(255,255,255,0.06)` | Card borders, dividers |
| `border-input` | `rgba(255,255,255,0.10)` | Focused input ring helpers |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `sm` | `8px` | Tooltips, small chips |
| `md` | `16px` | Cards, panels, dropdowns |
| `lg` | `24px` | Auth cards, large panels |
| `pill` | `999px` | Buttons, inputs, cookies banner |
| `navbar` | `48px` | Navbar container |

### Shadows

| Token | Value | Usage |
|---|---|---|
| `sm` | `0 2px 8px rgba(0,0,0,0.3)` | Small elevated elements |
| `md` | `0 4px 12px rgba(0,0,0,0.4)` | Bot dock, cookies popup |
| `lg` | `0 8px 24px rgba(0,0,0,0.5)` | Cards, dropdowns |
| `glow-blue` | `0 0 24px rgba(45,127,249,0.25)` | Register success radial glow |

### Spacing Scale (4px base)

`4 8 12 16 20 24 32 40 48 64 80px`

### Breakpoints

| Label | Width | Behaviour |
|---|---|---|
| Mobile | `< 1024px` | Sidebar forced collapsed |
| Desktop | `≥ 1024px` | Sidebar respects localStorage |

### Z-index Layers

| Layer | Value | Element |
|---|---|---|
| Base | 0 | Content |
| Sidebar | 10 | Sidebar panel |
| Navbar | 50 | Navbar |
| Bot Dock | 50 | Fixed bot dock |
| Dropdowns | 50 | Profile/Signup dropdowns |
| Cookies | 50 | Cookies banner |

---

## 4. Typography Scale

**Font family:** `Poppins` (Google Fonts, self-hosted via `next/font/google`)  
**CSS variable:** `--font-poppins`  
**Weights loaded:** 300 · 400 · 500 · 600 · 700 · 800  
**`font-display: swap`** — no FOIT

| Role | Size | Line-height | Weight | Tailwind class | Usage |
|---|---|---|---|---|---|
| Display | 48px | 56px | 300 | `text-display` | Auth headlines |
| Success | 56px | — | 300 | inline style | Register Successful screen |
| H1 | 32px | 40px | 700 | `text-h1` | Page titles |
| H2 | 26px | 34px | 600 | `text-h2` | Section titles |
| H3 | 22px | 30px | 500 | `text-h3` | Sub-section titles |
| Body-lg | 22px | 30px | 400 | `text-body-lg` | Sidebar labels |
| Body | 18px | 26px | 400 | `text-body` | General text |
| Body-sm | 16px | 24px | 400 | `text-body-sm` | Privacy link, chip labels |
| Label | 18px | 24px | 500 | `text-label` | Form field labels |
| Caption | 14px | 20px | 400 | `text-caption` | Error messages, badges |
| Button | 18px | 24px | 500 | `text-btn` | Button text |
| Wordmark | 30px | 36px | 800 | `text-wordmark` | Navbar logo text |
| Wordmark-sm | 28px | 36px | 800 | `text-wordmark-sm` | Auth footer logo text |

---

## 5. Asset Inventory

All design assets are sourced from `Codemo Assests/Codemo Website Elements 1.0/` and served from `/public/icons/`.

| File in Elements 1.0 | Public path | Usage |
|---|---|---|
| `Home (Default).svg` | `/icons/Home (Default).svg` | Sidebar — Home nav item |
| `Teams (Default).svg` | `/icons/Teams (Default).svg` | Sidebar — Team nav item |
| `Events (Default).svg` | `/icons/Events (Default).svg` | Sidebar — Events nav item |
| `Articles (Default).svg` | `/icons/Articles (Default).svg` | Sidebar — Articles nav item |
| `eLearn (Default).svg` | `/icons/eLearn (Default).svg` | Sidebar — eLearn nav item |
| `Projects (Default).svg` | `/icons/Projects (Default).svg` | Sidebar — Projects nav item |
| `Jams Bot (Default).svg` | `/icons/Jams Bot (Default).svg` | Bot Dock icon |
| `Light Mode (Default).svg` | `/icons/Light Mode (Default).svg` | Sidebar theme toggle |
| `Expand Dock (Default).svg` | `/icons/Expand Dock (Default).svg` | Sidebar expand hamburger |
| `Achievements (Default).svg` | `/icons/Achievements (Default).svg` | Profile dropdown |
| `Edit Profile (Default).svg` | `/icons/Edit Profile (Default).svg` | Profile dropdown |
| `Blue.png` | `/icons/Blue.png` | Favicon |

**Inline SVG assets** (absent from Elements 1.0, generated in code):
- Codemo logo mark — blue disc + white crescent arc + white dot, `components/layout/Navbar.tsx`
- Google icon — `components/ui/SocialButton.tsx`
- Apple icon — `components/ui/SocialButton.tsx`
- Microsoft icon — `components/ui/SocialButton.tsx`
- Eye show/hide icons — `components/ui/PasswordInput.tsx`

**Active icon tinting:** CSS utility class `icon-active` applies `filter: brightness(0) saturate(100%) invert(36%) sepia(88%) saturate(1600%) hue-rotate(200deg) brightness(108%) contrast(105%)` to recolour any sidebar SVG to `#2D7FF9`.

---

## 6. Component Inventory

### `<Navbar>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `isAuthenticated` | `boolean` | ✓ | Swaps Sign Up → Profile button |
| `user` | `{ firstName: string; avatarUrl?: string \| null }` | — | Shown in authenticated state |

**States:** default (unauthenticated) · authenticated · search-expanded · dropdown-open  
**Interactions:** search expand (240ms width animation) · dropdown toggle · click-outside close · Escape close  
**a11y:** `aria-expanded`, `aria-haspopup` on buttons; skip link to `#main-content`

---

### `<Sidebar>`

No props — reads from `useSidebarStore`.

**States:** expanded (220px) · collapsed (72px)  
**Animations:** `transition-[width] duration-[220ms] ease-out`  
**Persistence:** `localStorage['codemo.sidebar.expanded']`, default `false`  
**Responsive:** force-collapsed below 1024px via `resize` listener  
**a11y:** `aria-label="Sidebar navigation"`, `aria-current="page"` on active item, tooltips with `role="tooltip"`

---

### `<BotDock>`

No props.

**States:** collapsed (64px circle) · expanded (180px pill, on hover/focus)  
**Click:** `console.log('TODO: open Jams Bot panel')` stub  
**a11y:** `role="button"`, `aria-label`, `aria-expanded`, keyboard activatable

---

### `<CookiesBanner>`

No props.

**Logic:** shows when `localStorage['codemo.cookies.accepted'] !== 'true'`; Accept button sets flag + fade-out 200ms  
**a11y:** `role="region"`, `aria-label`, `aria-live="polite"`

---

### `<ProfileDropdown>`

| Prop | Type | Required |
|---|---|---|
| `user` | `{ firstName, lastName?, avatarUrl?, title?, level? }` | ✓ |
| `onClose` | `() => void` | ✓ |

**Rows:** Achievements (with level badge) · Edit Profile · Log out (text-error)  
**a11y:** `role="dialog"`, `aria-label`

---

### `<SignupDropdown>`

| Prop | Type | Required |
|---|---|---|
| `onClose` | `() => void` | ✓ |

**Contains:** Sign up / Login tab toggle + social provider buttons  
**a11y:** `role="dialog"`, `aria-label`

---

### `<Button>`

| Prop | Type | Default |
|---|---|---|
| `variant` | `'primary' \| 'secondary'` | `'primary'` |
| `size` | `'default' \| 'sm'` | `'default'` |
| `fullWidth` | `boolean` | `false` |

---

### `<Input>`

| Prop | Type | Notes |
|---|---|---|
| `id` | `string` | Required — used for `aria-describedby` error binding |
| `error` | `string` | Renders error message tied to input via `aria-describedby` |

---

### `<PasswordInput>`

Extends `<Input>` with embedded eye-toggle button. Same props.

---

### `<Chip>`

| Prop | Type | Notes |
|---|---|---|
| `label` | `string` | Button display text |
| `selected` | `boolean` | Active state styles |

`role="radio"`, `aria-checked` for accessibility.

---

### `<SocialButton>`

| Prop | Type | Notes |
|---|---|---|
| `provider` | `'google' \| 'apple' \| 'microsoft'` | Renders correct inline SVG |

---

## 7. Layout Primitives

### Navbar
- Height: **96px**
- Margin: **12px** from all viewport edges
- Background: `bg-surface` (`#1A1A1A`)
- Border-radius: `navbar` (**48px**)
- Padding: `0 24px 0 32px`
- Right cluster order: Join Us · Donate · Contact · Search button · Sign Up/Profile button

### Sidebar — Expanded
- Width: **220px**
- Background: `bg-surface`
- Radius: `0 0 16px 16px` (top corners flush with navbar)
- Padding: `16px 8px`
- Nav item height: **52px**, gap: **4px**
- Icon: **28px**, gap to label: **20px**
- Bottom utility: X close + sun, side by side

### Sidebar — Collapsed
- Width: **72px**
- Labels hidden (`opacity-0`)
- Tooltips on hover
- Bottom utility: sun + hamburger, stacked

### Bot Dock
- Position: fixed `bottom: 16px; left: 16px`
- Collapsed: **64px** circle
- Expanded (hover): **180px** pill, label "Jams Bot" 20px weight 400
- Transition: width 220ms ease-out
- Background: `bg-surface-elevated`

### Cookies Banner
- Position: fixed `bottom: 24px`, horizontally centred
- Width: **580px** · Height: **64px**
- Background: `bg-surface` · border-radius: `pill`
- Padding: `0 8px 0 32px`

### Profile Dropdown
- Width: **380px**
- Position: absolute, top `calc(100% + 10px)` from button, right-aligned
- Background: `bg-surface` · border-radius: `md` (16px) · padding: `24px`
- Avatar: **80px** with `2px solid accent-primary` border

### Sign Up Dropdown
- Width: **400px**
- Same position as Profile Dropdown

---

## 8. Theming System

**Default theme:** Dark  
**Toggle:** `useSidebarStore` (`/stores/theme.ts`) — persisted in `localStorage['codemo.theme']`

The theme toggle switches a `dark` / `light` class on `<html>`. Currently only the dark theme is fully specified. Light mode is stubbed — `isDark = false` sets `class="light"` on `<html>` for future styling.

**To add a new theme:**
1. Add a new theme name to `ThemeStore` in `stores/theme.ts`
2. Define CSS variables scoped to `.themeName` in `app/globals.css`
3. Extend `Tailwind` dark mode selector or use `:root[data-theme="themeName"]` in `globals.css`

**CSS variable naming convention:** All tokens are in `tailwind.config.ts` as named colours (e.g. `bg-surface`, `accent-primary`) and used as Tailwind utility classes.

---

## 9. Routing Map

| Route | Auth Guard | Layout | Description |
|---|---|---|---|
| `/` | Public | App shell | Home placeholder |
| `/team` | Protected | App shell | Team page |
| `/events` | Protected | App shell | Events page |
| `/articles` | Protected | App shell | Articles page |
| `/elearn` | Protected | App shell | eLearning page |
| `/projects` | Protected | App shell | Projects page |
| `/profile/achievements` | Protected | App shell | Achievements |
| `/profile/edit` | Protected | App shell | Edit profile |
| `/privacy` | Public | App shell | Privacy policy stub |
| `/terms` | Public | App shell | Terms stub |
| `/contact` | Public | App shell | Contact stub |
| `/donate` | Public | App shell | Donate stub |
| `/join-us` | Public | App shell | Join us stub |
| `/auth` | Redirect if authed → `/` | Auth shell | Email entry |
| `/auth/login` | Redirect if authed → `/` | Auth shell | Login |
| `/auth/signup` | Redirect if authed → `/` | Auth shell | Signup step 1 |
| `/auth/signup/details` | — | Auth shell | Signup step 2 |
| `/auth/signup/career` | — | Auth shell | Signup step 3 |
| `/auth/signup/verify` | — | Auth shell | Signup step 4 |
| `/auth/signup/success` | — | Auth shell | Success |

**Guard implementation:** `proxy.ts` — `getToken()` from NextAuth JWT; unauthenticated → `/auth?redirect=<path>`

---

## 10. State Management

### Zustand Stores

| Store | File | Persistence | Key | Default |
|---|---|---|---|---|
| Sidebar | `stores/sidebar.ts` | `localStorage` | `codemo.sidebar.expanded` | `false` (collapsed) |
| Theme | `stores/theme.ts` | `localStorage` | `codemo.theme` | `{ isDark: true }` |
| Signup draft | `stores/signup.ts` | `sessionStorage` | `codemo.signup.draft` | empty strings |

**Signup draft fields:** `email · password · dob { dd, mm, yyyy } · username · gender · domain · status · confirmationCode`  
Draft is cleared via `clearDraft()` on successful registration.

### TanStack Query

Used for all server data fetching (user profiles, content listings). Default `staleTime: 60s`.  
`QueryProvider` wraps the root layout — client components access via `useQuery`.

---

## 11. API Contracts

### `POST /api/auth/email-check`
**Request:** `{ email: string }`  
**Response:** `{ exists: boolean }` (always 200 — no enumeration via status code)

### `POST /api/auth/signup`
**Request:** `{ email, password, dob (ISO string), username, gender, domain, status }`  
**Response 201:** `{ created: true }`  
**Errors:** 400 invalid payload · 409 email/username conflict

### `POST /api/auth/verify`
**Request:** `{ email, code (6-digit string), recaptchaToken }`  
**Response 200:** `{ verified: true }`  
**Errors:** 400 invalid/expired code · 403 reCAPTCHA failed

### `POST /api/auth/resend`
**Request:** `{ email }`  
**Response 200:** `{ sent: true }`  
**Rate limits:** 1 per 60s per email · 5 per hour per email  
**Errors:** 429 rate limit exceeded

### `GET /api/auth/username?q=<username>`
**Response:** `{ available: boolean }`  
**Errors:** 400 invalid format

### `POST /api/auth/[...nextauth]`
NextAuth standard handler — credentials + OAuth

---

## 12. Auth Flow

### Signup State Machine

```
/auth  →  email entered
  ├─ email registered  →  /auth/login
  └─ email new  →  /auth/signup
       → /auth/signup/details
       → /auth/signup/career  (also sends verification email)
       → /auth/signup/verify  (POST /api/auth/verify → POST /api/auth/signup)
       → /auth/signup/success  →  auto-redirect /  after 2.5s
```

### Login Flow

```
/auth  →  Continue with registered email  →  /auth/login
  → credentials signIn()  →  reCAPTCHA check  →  rate limit check  →  Argon2id verify
  → session created (database strategy)  →  redirect /
```

### Session Lifecycle

- Strategy: **database sessions** via `@auth/prisma-adapter`
- Lifetime: **7 days** sliding window (`updateAge: 24h`)
- Cookie: `HttpOnly Secure SameSite=Strict`
- OAuth: tokens stored in `Account` table; user record created on first OAuth login

---

## 13. Security Posture

### Password Hashing
- Algorithm: **Argon2id**
- Memory cost: **64 MB** (`memoryCost: 65536`)
- Time cost: **3 iterations**
- Parallelism: 1

### Rate Limiting (Upstash Redis sliding window)
- Login: **5 attempts / 15 min** per IP AND per email (separate keys)
- Email verify resend: **1 per 60s** + **5 per hour** per email

### Security Headers (applied in `proxy.ts` + `next.config.ts`)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: nonce-based script-src; recaptcha and Google Fonts allowlisted
```

### OWASP Coverage

| Threat | Mitigation |
|---|---|
| SQL Injection | Prisma parameterised queries (no raw SQL) |
| XSS | React output encoding + CSP nonce-based script-src |
| CSRF | SameSite=Strict session cookie |
| User enumeration | Generic login error message; email-check always returns 200 |
| Brute force | Rate limiting per IP + per account |
| Session hijacking | HttpOnly Secure cookies, 7-day sliding expiry |
| Supply chain | npm audit in CI; no runtime eval |

### Known Residual Vulnerabilities (moderate, non-runtime)

| Package | Severity | Notes |
|---|---|---|
| `postcss` | Moderate | CSS XSS in stringify output — dev/build tool only, not runtime |
| `next-auth` | Moderate | Transitive dep on postcss — same issue |

Target: resolve in next `npm audit fix` cycle or upstream patch.

---

## 14. Build & Deploy

### Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npx prisma migrate dev` | Run DB migrations in dev |
| `npx prisma migrate deploy` | Deploy migrations in production |
| `npx prisma generate` | Regenerate Prisma client |

### Required Environment Variables

```bash
NEXTAUTH_URL=https://codemo.app
NEXTAUTH_SECRET=<openssl rand -base64 32>
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
POSTMARK_API_KEY=...
POSTMARK_FROM_EMAIL=noreply@codemo.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...
APPLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
```

Template: `.env.local.example` at repo root.

### CI Pipeline (GitHub Actions — recommended)

```yaml
jobs:
  quality:
    steps:
      - npm ci
      - npm run type-check
      - npm run lint
      - npm audit --audit-level=high
      - npx trivy fs --exit-code 1 --severity HIGH,CRITICAL .
      - npm run build
```

---

## 15. Testing Strategy

### Unit Tests (Vitest)

Target: `lib/validations/`, `lib/rate-limit.ts`, store reducers  
Coverage threshold: **≥ 80%** on business logic  
Run: `npx vitest`

### Integration Tests (Testing Library)

Target: auth form flows, Chip selection, PasswordInput toggle  
Run: `npx vitest --environment jsdom`

### E2E Tests (Playwright)

Golden paths:
1. Full signup flow (email → verify → success)
2. Login flow (credentials)
3. Sidebar expand/collapse
4. Cookies banner accept

Run: `npx playwright test`

---

## 16. Changelog

### v1.1.0 — 2026-04-25

**Refactor:** High-Fidelity UI Refactor (macOS 26 Tahoe)
- **Theme Migration**: Implemented the "Codemo UI" design system across the application. Replaced solid colors and utility classes with macOS-inspired glassmorphism tokens.
- **CSS Variables**: Added core CSS variables to `globals.css` (e.g., `--bg`, `--nav-glass`, `--side-glass`, `--card-glass`, `--blur`) and updated `tailwind.config.ts`.
- **Layout Structure**: Refactored `app/(app)/layout.tsx` to use absolute/fixed positioning for the `Navbar`, `Sidebar`, `BotDock`, and `CookiesBanner`.
- **Component Updates**:
  - **Navbar**: Updated to a floating glass header with rounded bottom corners (`rounded-b-[22px]`). Adjusted search and profile components to use glass styles.
  - **Sidebar**: Redesigned as a floating left pane (`w-[200px]` expanded, `w-[70px]` collapsed) with a separate floating Logout orb.
  - **BotDock**: Styled as a floating card on the bottom-right.
  - **CookiesBanner**: Transformed into a pill-shaped `glass-card` floating at the bottom center.
  - **Dropdowns**: Updated `ProfileDropdown` and `SignupDropdown` to match the glassmorphism aesthetic.

### v1.0.0 — 2026-04-25

**Migration:** Replaced Vite + React 19 + JavaScript + vanilla CSS shell with Next.js 16 App Router + TypeScript strict + TailwindCSS 3.4 + full backend.

**Added:**
- All 13 screens from the reference screenshot spec
- NextAuth v5 (credentials + Google + Apple + Microsoft OAuth)
- Prisma schema (User, Account, Session, VerificationToken, AuditLog)
- Full signup multi-step flow with Zustand state + sessionStorage persistence
- Email verification via Postmark (6-digit code, 10-min expiry, single use)
- Google reCAPTCHA v2 on login + verify pages
- Upstash Redis rate limiting (login 5/15min, resend 1/60s + 5/h)
- Argon2id password hashing (64MB memory, 3 iterations)
- Security headers via `proxy.ts` (CSP nonce, HSTS, X-Frame-Options, etc.)
- Cookies banner with localStorage consent gate
- Sidebar expand/collapse with localStorage persistence
- Bot Dock with hover expand animation
- Profile Dropdown (authenticated state)
- Sign Up Dropdown (unauthenticated state)
- TailwindCSS design token system (13 colours, 5 radii, 4 shadows)
- Poppins font (6 weights, self-hosted via next/font/google)

---

## 17. Future Add-on Guide

### Adding a New Page

1. Create `app/(app)/new-page/page.tsx` — exports a React Server Component
2. Add to `PROTECTED_ROUTES` in `proxy.ts` if auth-gated
3. Add nav item to `navItems` array in `components/layout/Sidebar.tsx` with icon path and href
4. Add SVG to `public/icons/` (sourced from Elements 1.0)
5. Update the Routing Map in this document

### Adding a New Shared Component

1. Create `components/ui/NewComponent.tsx`
2. Use `cn()` from `lib/utils.ts` for conditional classes
3. Add to Component Inventory section above with props table and accessibility notes

### Adding a New Theme Variant

1. Add theme name to `ThemeStore` in `stores/theme.ts`
2. Scope CSS variables in `app/globals.css`: `.my-theme { --bg-base: ...; }`
3. Add a new data attribute to the `document.documentElement` toggle in `useThemeStore`
4. Document the new token mappings in [Section 8](#8-theming-system)

### Adding a New Auth Role

1. Add the role string to the `User.role` field — no schema change needed (it's a plain string)
2. Add role check logic in `proxy.ts` route guard
3. Extend the NextAuth session callback in `lib/auth.ts` to pass the role to the session
4. Augment the session type in `types/next-auth.d.ts`

### Adding a New OAuth Provider

1. Install the NextAuth provider: `npm install @auth/provider-name`
2. Import and add to `providers` array in `lib/auth.ts`
3. Add `PROVIDER_CLIENT_ID` and `PROVIDER_CLIENT_SECRET` to `.env.local` and `.env.local.example`
4. Add a `<SocialButton>` with the provider icon in `SignupDropdown.tsx`, `SocialButton.tsx`, and `/auth/page.tsx`

### Adding a New Signup Step

1. Create `app/auth/signup/new-step/page.tsx`
2. Add new fields to `SignupDraft` in `stores/signup.ts`
3. Add a Zod schema to `lib/validations/auth.ts`
4. Add the field to the `POST /api/auth/signup` payload schema
5. Update the Prisma `User` model in `prisma/schema.prisma` + run `prisma migrate dev`
6. Update the routing map and signup state machine diagram above
