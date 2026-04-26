# Frontend Architecture & Standards

**Last Updated:** 2026-04-26

## Stack

* Next.js 14+ App Router with TypeScript strict mode.
* TailwindCSS 3.4+ with custom token configuration.
* Zustand for client state, TanStack Query for server data fetching.
* react-hook-form with Zod resolvers.
* NextAuth.js for authentication.
* Poppins font via `next/font/google` (Weights: 300, 400, 500, 600, 700, 800).

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

## Asset Rule

1. **Source of Truth:** Every visual asset must originate from `Codemo Assets/Codemo Website Elements 1.0`.
2. **No Substitutions:** Never substitute with library equivalents (e.g., no Lucide or Heroicons swap-ins).
3. **Missing Assets:** If an asset appears missing, raise a ticket. Do not improvise or source externally.

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

## API Client

* Located in `lib/api/`.
* Wraps every request with:
  * Authentication headers.
  * CSRF tokens.
  * Request nonces.
  * Timestamps.
* Automatically encrypts the payload envelope for sensitive endpoints (login, signup, password change).
* Verifies response signatures for auth-state endpoints to prevent tampering.
