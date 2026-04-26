# ADR-0005: Exclusive Typography (Poppins)

**Status:** Accepted

## Context
Design consistency is paramount for establishing brand identity and trust. Allowing multiple typefaces or falling back to unstyled system fonts dilutes the "Codemo" aesthetic. We need a performant, globally available typeface that scales well across display headers and dense UI elements.

## Decision
We will exclusively use the `Poppins` typeface from Google Fonts for all textual content across the Codemo ecosystem.
* It will be implemented via `next/font/google` to ensure zero layout shift (CLS) and optimal loading performance.
* Loaded weights: 300, 400, 500, 600, 700, 800.
* No secondary or fallback web fonts will be loaded, save for generic system sans-serif as a last resort.

## Consequences
* **Positive:** Guaranteed brand consistency across all platforms and browsers.
* **Positive:** `next/font` integration ensures CSS and font files are downloaded at build time, eliminating external network requests during page load.
* **Negative:** Restricts design flexibility if a specific feature theoretically benefits from a monospace or serif font (though currently out of scope).

## Alternatives Considered
* **Inter / Roboto:** Rejected as they lack the specific geometric, approachable brand character provided by Poppins.
* **System Font Stack:** Rejected because it results in inconsistent rendering across macOS, Windows, and Linux, harming the premium feel of the application.
