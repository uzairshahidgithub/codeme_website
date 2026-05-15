# ADR-0011: Home Page — SSR + CSS Reveal Now, GSAP Later

**Status:** Accepted
**Date:** 2026-05-09

## Context

The home page is the public landing surface and the most-visited route in the application. The brief calls for a heavily animated experience, including a multi-stage scroll-tied 3D hero (Earth → person → scientist), staggered card reveals, and editorial typography reveals on mount. The most fluent toolset for that pattern is GSAP + ScrollTrigger, optionally with `@react-three/fiber` for the 3D scene.

Two pressures push back against shipping GSAP in the same sprint as the home page itself:

1. **Bundle weight.** GSAP's `ScrollTrigger` plugin is roughly 25 KB minified before the 3D bits. `@react-three/fiber` + `drei` adds 100 KB+. Loading both eagerly degrades LCP on the home page, the page where LCP matters most.
2. **Time pressure.** The data wiring (events, courses, testimonials, founder message), Supabase RLS, skeletons, empty/error states and SEO surface alone is a full sprint. Animation polish should not block the data going live.

We considered three options:

* **Ship GSAP + 3D in this sprint.** Faithful to the visual brief, but at the cost of bundle weight and a longer sprint.
* **Ship a static page.** Faithful to budgets, but loses the editorial motion the brief explicitly calls for.
* **Ship CSS reveal animations now, GSAP later.** Compromise.

## Decision

We ship the home page server-side rendered with **CSS-only reveal animations** for v1. GSAP and the 3D scene are deferred to a follow-up sprint. To make that follow-up cheap, every animation entry point in the home components is annotated with a `TODO:GSAP` comment block of a fixed shape, and selectors (`.home-card`, `.home-hero-line`, `.home-hero-canvas`, `.founder-photo`, `.founder-body`) are deliberately stable so GSAP can attach without JSX changes.

The hero 3D scene is rendered as a deliberate placeholder canvas with a dashed border, a subtle blue grid, and a `// TODO:GSAP 3D Scene` mono label. It does not pretend to be the final scene; it explicitly reads as a placeholder.

Data sections (events, courses, testimonials, founder) are server components wrapped in `unstable_cache` with section-specific TTLs (60s / 300s / 600s / 3600s respectively). They stream in via `<Suspense>` so the hero and footer paint without waiting on the network.

## Consequences

### Positive
* Initial home-page bundle stays well under the 170 KB gzipped budget. No GSAP, no R3F, no Three.
* SSR + Suspense gives a fast first paint and a streaming data load that does not block the hero.
* Skeletons match real card dimensions so CLS stays at 0.
* The CSS reveal (`@keyframes home-fade-up`) respects `prefers-reduced-motion` automatically.
* The follow-up GSAP sprint touches only behaviour, not layout or data wiring.

### Negative
* The page is visibly less "alive" than the final design intends. Reveals are once-off CSS, not scroll-tied.
* The hero placeholder is honest about its placeholder-ness, which some stakeholders may read as unfinished. The `// TODO:GSAP 3D Scene` mono label is intentionally explicit.
* When GSAP arrives, the CSS `home-reveal` rules will need to be either disabled per-component or converted to ScrollTrigger triggers. A simple `data-gsap="ready"` attribute on `<html>` switching off the CSS class is acceptable if needed.

### Reversibility
Fully reversible. To bring the GSAP sprint forward:

1. Add `gsap` and the chosen 3D library as dependencies.
2. Mount a single client-only `HomeAnimations` component inside `app/(app)/page.tsx`.
3. Move the CSS reveal selectors into a feature-flagged stylesheet that is suppressed once GSAP attaches.
4. Implement the hero 3D scene as a dynamically imported module so non-WebGL clients still see the placeholder.

No data layer changes are required.
