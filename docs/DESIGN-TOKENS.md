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

## Token JSON Schema

* **Reference:** `/config/tokens.default.json`
* **Versioning:** Changes to tokens require a minor version bump in the shared package.
* **Adding Tokens:** New tokens must be introduced via a PR. Non-trivial systemic changes require an ADR.

## Dev Editor Reference

1. **Launch:** Run `pnpm run tokens:editor` locally.
2. **Usage:** Import the current JSON, modify values via the GUI, and export the resulting JSON.
3. **Validation:** The exporter automatically validates against our JSON schema.
4. **Permissions:** Only design system leads have merge rights for token changes in the `shared` repository.
