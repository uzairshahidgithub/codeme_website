# Codemo Teams

Codemo Teams is a collaborative workspace bridging the gap between design and engineering.

## Tech Stack at a Glance

* **Frontend:** Next.js 16, TailwindCSS, Zustand, TanStack Query, `@supabase/ssr`.
* **Backend:** Supabase only — Postgres, Auth, Storage, Edge Functions (Deno + TypeScript), Realtime.
* **Edge:** Cloudflare (DNS, SSL Full Strict, WAF, Turnstile).
* **Hosting:** Vercel (frontend) + Supabase hosted (backend).
* **Email:** Self-hosted Postal SMTP on Oracle Cloud Always-Free VM, accessed via the `send-email` Edge Function (See [ADR-0009](docs/adr/0009-postal-smtp-over-resend.md) and [`smtp/`](smtp/)).
* **Design:** Poppins typography, design tokens via CSS variables.

See [ADR-0008](docs/adr/0008-drop-railway-supabase-only.md) for why we collapsed to Vercel + Supabase + Cloudflare.

## Repository Structure

```
frontend/        Next.js application (Vercel)
supabase/        Migrations, Edge Functions, config
docs/            Living documentation
config/          Design tokens
Codemo Assets/   Source SVGs and brand assets
```

## Branch Model

Two protected branches. We do not use `main` or `master`.

* `frontend` — Next.js application. Deploys automatically to Vercel.
* `supabase` — Migrations and Edge Functions. Deployed via the Supabase CLI.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/uzairshahidgithub/Codemo-Website.git
cd Codemo-Website

# 2. Install
pnpm install

# 3. Frontend env
cp frontend/.env.example frontend/.env.local
# populate values from Supabase Dashboard → Settings → API

# 4. (Optional) local Supabase
pnpm supa:start          # boots Postgres + Auth + Studio (Docker required)
pnpm db:reset            # apply migrations + seed
pnpm functions:serve     # serve Edge Functions locally

# 5. Run the frontend
pnpm dev
```

## Workspace Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Frontend dev server |
| `pnpm build` | Frontend production build |
| `pnpm typecheck` | `tsc --noEmit` against the frontend |
| `pnpm db:push` | Push Supabase migrations to the linked project |
| `pnpm db:reset` | Local DB reset + apply migrations + seed |
| `pnpm db:diff` | Diff a local Studio change into a new migration |
| `pnpm functions:deploy` | Deploy all Edge Functions |
| `pnpm functions:serve` | Serve Edge Functions locally |
| `pnpm supa:start` / `:stop` / `:status` | Manage local Supabase |

## How to Contribute

Read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for code style, branching, and PR rules.

## Documentation Index

| File | Description |
|---|---|
| [docs/documentation.md](docs/documentation.md) | Living index. Component, route, state inventories. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System topology. |
| [docs/REPOSITORY-RULES.md](docs/REPOSITORY-RULES.md) | Branches, commits, PRs. |
| [docs/BRANCHING.md](docs/BRANCHING.md) | Branching workflows. |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel, Supabase CLI, Cloudflare runbooks. |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend conventions. |
| [docs/SUPABASE.md](docs/SUPABASE.md) | Schema, RLS, Edge Function inventory, Dashboard config. |
| [docs/DATABASE-RULES.md](docs/DATABASE-RULES.md) | Query and transaction constraints. |
| [docs/API-RULES.md](docs/API-RULES.md) | Edge Function envelope and CORS rules. |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, headers, secret handling. |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Env vars (frontend + Edge Functions). |
| [docs/DESIGN-TOKENS.md](docs/DESIGN-TOKENS.md) | Colours, typography, spacing. |
| [docs/TESTING.md](docs/TESTING.md) | Test stack and coverage. |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | PR templates, style. |
| [docs/RUNBOOKS.md](docs/RUNBOOKS.md) | Incident response. |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Version history. |
| [docs/adr/](docs/adr/) | Architecture decision records, including [ADR-0008](docs/adr/0008-drop-railway-supabase-only.md). |

## License

Copyright © Codemo Teams. All rights reserved.
