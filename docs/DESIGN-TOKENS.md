# Design Tokens

**Last Updated:** 2026-04-26

## Token Registry

### Colours
| Name | Hex Value | Usage Context | Contrast Pairs |
|------|-----------|---------------|----------------|
| `primary` | `#0A0A0A` | Main backgrounds | `primary-foreground` |
| `primary-foreground` | `#FFFFFF` | Text on primary | `primary` |
| `accent` | `#3B82F6` | Call to action buttons | `accent-foreground` |

*(This table is an example; populate fully from the Tailwind config.)*

### Spacing
| Name | px Value | rem Value | Usage Context |
|------|----------|-----------|---------------|
| `space-1` | 4px | 0.25rem | Tighter component internal padding |
| `space-2` | 8px | 0.5rem | Standard component padding |
| `space-4` | 16px | 1rem | Standard container margin |

### Border Radius
| Name | Value | Usage Context |
|------|-------|---------------|
| `radius-sm` | 4px | Buttons, small inputs |
| `radius-md` | 8px | Cards, modals |
| `radius-full` | 9999px | Avatars, circular icons |

### Shadows
| Name | Value | Usage Context |
|------|-------|---------------|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Modals, dropdowns |

### Breakpoints
| Name | Value | Query |
|------|-------|-------|
| `sm` | 640px | `@media (min-width: 640px)` |
| `md` | 768px | `@media (min-width: 768px)` |
| `lg` | 1024px | `@media (min-width: 1024px)` |
| `xl` | 1280px | `@media (min-width: 1280px)` |

### Z-Index Layers
| Name | Value | Usage Context |
|------|-------|---------------|
| `z-base` | 0 | Default content |
| `z-nav` | 40 | Navbar, bot dock |
| `z-modal` | 50 | Overlays and dialogs |

## Typography Scale

* **Family:** Poppins (Weights loaded: 300, 400, 500, 600, 700, 800)

| Role | Size | Line Height | Weight | Letter Spacing |
|------|------|-------------|--------|----------------|
| `display` | 48px | 1.1 | 700 | -0.02em |
| `h1` | 36px | 1.2 | 700 | -0.01em |
| `h2` | 24px | 1.3 | 600 | normal |
| `h3` | 20px | 1.4 | 600 | normal |
| `body-lg` | 18px | 1.6 | 400 | normal |
| `body` | 16px | 1.6 | 400 | normal |
| `body-sm` | 14px | 1.5 | 400 | normal |
| `label` | 12px | 1.4 | 500 | 0.05em (uppercase) |
| `caption` | 12px | 1.4 | 400 | normal |

## External Asset Theme Compliance

Any icon, illustration or asset pulled in via Tier 2 of the [Icon and Asset Resolution Strategy](FRONTEND.md#icon-and-asset-resolution-strategy) must comply with Codemo design tokens. Hardcoded hex colours are forbidden regardless of source.

### Icon sizing scale (by context)

| Context | Size | Stroke width | Example |
|---|---|---|---|
| Inline (within text body) | 16px | 1.5 | `<Icon size={16} strokeWidth={1.5} />` |
| Action rows / list rows | 20px | 1.5 | `<Icon size={20} strokeWidth={1.5} />` |
| Buttons / sidebar nav | 24px | 1.5 | `<Icon size={24} strokeWidth={1.5} />` |
| Hero / featured visuals | 28px | 1.5 | `<Icon size={28} strokeWidth={1.5} />` |

### Colour rules

* **Always** colour via `currentColor` or a CSS variable: `text-[var(--text-tertiary)]`, `text-[var(--accent-primary)]`, etc.
* **Never** apply colour via inline `style={{ color: '#...' }}` or hardcoded Tailwind hex utilities.
* Active state uses `var(--accent-primary)`. Default state uses `var(--text-tertiary)`. Hover lifts to `var(--text-primary)`.
* External SVGs must have `fill` and `stroke` attributes stripped from source and replaced with `currentColor` or `var(--token)` before commit.

### Container rules

* Wrap external SVG assets in a sized container (explicit width and height) — never relying on intrinsic SVG dimensions.
* Test in both dark and light theme before committing.

### 3D and texture assets

* Lighting rig: `AmbientLight 0.4` · `DirectionalLight` (sun) · `PointLight #2D7FF9` (rim, sourced from `var(--accent-primary)`).
* Canvas background transparent — page background shows through.
* Postprocessing Bloom defaults: `luminanceThreshold 0.2` · `intensity 0.4`.

### Illustration recolouring

* unDraw exports: set primary colour to `#2D7FF9` (matches `var(--accent-primary)`) before download.
* Storyset / Humaaans: customise to match dark background, remove white backgrounds, scale to container.

## Token JSON Schema

* **Reference:** `/config/tokens.default.json`
* **Versioning:** Changes to tokens require a minor version bump in the shared package.
* **Adding Tokens:** New tokens must be introduced via a PR. Non-trivial systemic changes require an ADR.

## Dev Editor Reference

1. **Launch:** Run `pnpm run tokens:editor` locally.
2. **Usage:** Import the current JSON, modify values via the GUI, and export the resulting JSON.
3. **Validation:** The exporter automatically validates against our JSON schema.
4. **Permissions:** Only design system leads have merge rights for token changes in the `shared` repository.
