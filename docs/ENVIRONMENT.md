# Environment Variable Registry

**Last Updated:** 2026-05-07

The MVP runs on a single Supabase project, on Vercel + Supabase + Cloudflare. There is no Node.js API tier, so there is no `backend/.env`. Edge Function secrets are stored separately via the Supabase CLI.

## Frontend (`frontend/.env.local` for dev, Vercel env for production)

| Variable | Scope | Required | Default | Description |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Yes | — | Supabase project URL. Browser-safe. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Yes | — | Supabase anon key. Browser-safe (RLS enforces access). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | All | Yes | — | Cloudflare Turnstile site key. Browser-safe. |
| `NEXT_PUBLIC_SITE_URL` | All | Yes | `https://codemoteam.org` | Used for OAuth redirect URLs and email links. |
| `NEXT_PUBLIC_DEV_EDITOR` | Preview | No | `false` | Enables the in-page dev editor in non-production environments. |

Any variable prefixed `NEXT_PUBLIC_` ships in the client bundle. Do not put secrets in these.

The frontend does **not** need the service role key. All admin operations happen inside Edge Functions.

## Edge Functions (`supabase secrets set`)

These are set via `supabase secrets set --env-file ./supabase/functions/.env`. The local file is gitignored.

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key. Bypasses RLS. **Never expose to the browser.** |
| `SMTP_HOST` | Yes | Postal SMTP host. Default `mail.codemoteam.org`. |
| `SMTP_PORT` | Yes | `587` for STARTTLS submission, `465` for implicit TLS. |
| `SMTP_USER` | Yes | SMTP credential username from Postal Admin UI. |
| `SMTP_PASS` | Yes | SMTP credential password from Postal Admin UI. |
| `EMAIL_FROM` | Yes | `noreply@codemoteam.org`. Domain must be provisioned in Postal. |
| `TURNSTILE_SECRET_KEY` | Yes | Turnstile secret key for server-side token verification. |

## Frontend Workspace Dependencies (expected `pnpm --filter frontend list`)

Icon and asset libraries currently installed:

| Package | Version | Purpose |
|---|---|---|
| `lucide-react` | latest | Primary Tier 2 icon source (see [FRONTEND.md](FRONTEND.md#icon-and-asset-resolution-strategy)) |

If you adopt a second icon library (Heroicons, Phosphor, Tabler, Iconify), document it here and in `docs/FRONTEND.md`. Do not add a second library when the first already covers the need.

## Local Development Setup

1. **Clone & install:**
   ```bash
   git clone https://github.com/uzairshahidgithub/Codemo-Website.git
   cd Codemo-Website
   pnpm install
   ```

2. **Set frontend env:**
   ```bash
   cp frontend/.env.example frontend/.env.local
   # populate values from the Supabase Dashboard → Settings → API
   ```

3. **Set Edge Function env (optional, only if running functions locally):**
   ```bash
   cp supabase/functions/.env.example supabase/functions/.env
   # populate values
   ```

4. **Start Supabase locally (requires Docker):**
   ```bash
   pnpm supa:start          # boots Postgres, Auth, Studio at localhost:54323
   pnpm db:reset            # apply migrations + seed
   pnpm functions:serve     # serve Edge Functions on localhost:54321/functions/v1
   ```

5. **Start the frontend:**
   ```bash
   pnpm dev
   ```

## Environment Variables Removed in This Migration

The following variables existed under the old Railway + multi-project architecture and have been removed. If they appear in your local `.env.local`, delete them.

* `NEXT_PUBLIC_API_URL`
* `NEXT_PUBLIC_SUPABASE_CORE_URL` → renamed to `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_CORE_ANON_KEY` → renamed to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_CORE_SERVICE_KEY` → moved to Edge Functions only as `SUPABASE_SERVICE_ROLE_KEY`
* `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
* `DATABASE_URL` (we connect to Supabase only)
* `JWT_SECRET`, `JWT_SIGNING_SECRET`, `CSRF_SECRET`
* `ENCRYPTION_KEY_SYMMETRIC`, `ED25519_PRIVATE_KEY`, `API_PRIVATE_KEY`, `PAYLOAD_PRIVATE_KEY`
* `NEXT_PUBLIC_API_PUBLIC_KEY`, `NEXT_PUBLIC_PAYLOAD_PUBLIC_KEY`
* `POSTMARK_*` and `RESEND_API_KEY` (replaced by self-hosted Postal SMTP — see [ADR-0009](adr/0009-postal-smtp-over-resend.md). Edge Functions now read `SMTP_HOST/PORT/USER/PASS` instead.)
* `RECAPTCHA_*` (replaced by Cloudflare Turnstile)
* All `SUPABASE_<FEATURE>_*` per-project variables (single project for MVP)
