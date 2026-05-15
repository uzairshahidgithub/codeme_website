# Contributing Guide

**Last Updated:** 2026-04-26

Please note that this project is governed by a Code of Conduct. By participating, you are expected to uphold this code.

## How to File an Issue

1. Navigate to the GitHub Issues tab.
2. Select the appropriate template:
   * **Bug Report:** Use this to report unexpected behaviour. Requires reproduction steps, expected outcome, and actual outcome.
   * **Feature Request:** Use this to propose new features or enhancements.
3. **Security Vulnerabilities:** Do **not** open a public issue. Use the private security reporting channel provided in the repository's security advisory section.

## How to Open a Pull Request

1. Branch off the appropriate target (`frontend`, `backend`, or `shared`) per our [Branching Strategy](BRANCHING.md).
2. Commit your changes using Conventional Commits.
3. Push your branch and open a PR against the target branch.
4. **Complete the PR Template:** Fill out all sections, including linking related issues and attaching screenshots for UI changes.
5. **Review Expectations:** Ensure CI checks pass. Maintainers aim to provide initial review feedback within 48 hours.

## Icon and Asset Usage

The previous "Codemo Assets only, no substitutions" rule is **revoked**. All icons and assets follow a three-tier resolution system documented in [FRONTEND.md → Icon and Asset Resolution Strategy](FRONTEND.md#icon-and-asset-resolution-strategy).

**Quick guide for new contributors:**

1. **Check local first.** Look in `Codemo Assets/Codemo Website Elements 1.0/` for a matching asset. If present and the format works, use it.
2. **If absent, do not pause.** Resolve immediately from a free open-source library — Lucide React is the primary fallback:
   ```bash
   pnpm --filter frontend add lucide-react
   ```
   ```tsx
   import { Calendar } from 'lucide-react'
   <Calendar size={24} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
   ```
3. **Single-library preference.** If Lucide is already installed, use it. Do not add Heroicons or Phosphor for one icon.
4. **Never hardcode icon colour.** Always use `currentColor` or a CSS variable (`text-[var(--accent-primary)]`, `text-[var(--text-tertiary)]`). No inline `style={{ color: '#...' }}`.
5. **Document the source.** When pulling from Tier 2, add a comment: `// Icon: Lucide/Calendar — local asset unavailable`. Update the Icon Source column in `documentation.md` Component Inventory.
6. **Last resort: compose or hand-author SVG.** Never leave an empty slot, broken image or missing icon.

Theme compliance rules (sizing scale, colour tokens, container rules) are documented in [DESIGN-TOKENS.md → External Asset Theme Compliance](DESIGN-TOKENS.md#external-asset-theme-compliance).

## Code Style

* **Linting & Formatting:** We use ESLint and Prettier. Configurations are strictly enforced across the monorepo.
* **Pre-commit Hooks:** Husky and `lint-staged` automatically format code and run relevant tests prior to commit.
* **EditorConfig:** Ensure your IDE supports `.editorconfig` to maintain consistent whitespace and line endings across all files.

## Communication

* **Questions:** For architectural questions or implementation help, use GitHub Discussions or the internal team chat channel.
* **Maintainer SLA:** Maintainers commit to reviewing PRs and answering critical discussions within 2 business days.
* **Escalation:** If an issue is blocked for more than 5 days, escalate by tagging the relevant Tech Lead defined in `CODEOWNERS`.

## Useful Resources

Sprint-planning lookups. Full context, integration rules and licence guidance live in [FRONTEND.md → Future Recommendations and Free Resources](FRONTEND.md#future-recommendations-and-free-resources).

* **[RapidAPI free APIs collection](https://rapidapi.com/collection/list-of-free-apis)** — `[FUTURE]` curated catalogue of free third-party APIs for new feature ideas. Wrap every call in an Edge Function.
* **[free-for.dev](https://free-for.dev/)** — `[REFERENCE]` comprehensive free-tier directory across hosting, monitoring, CI, analytics and storage. Check before paying for anything.
* **[Iconify icon sets](https://icon-sets.iconify.design/)** — `[FUTURE]` 200 000+ icons across 150+ sets behind one API. Slotted as Tier 2 in the icon resolution order; verify per-set licence before use.
