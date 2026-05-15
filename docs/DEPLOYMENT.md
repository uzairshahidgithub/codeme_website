# Deployment Guide

**Last Updated:** 2026-05-07

## Frontend Deployment via Vercel

* **Platform:** Vercel
* **Production branch override:** `frontend` (not `main`)
* **Root directory:** `frontend`
* **Build command:** `pnpm build`
* **Install command:** `pnpm install`
* **Output directory:** `.next`

### Custom Domain & SSL
* **Domain:** `codemoteam.org`, registered at Namecheap or LCN.
* **DNS:** Delegated to Cloudflare.
* **SSL:** Cloudflare Full Strict.

### Environment Variables (Vercel Dashboard)
Per-environment scoping:
* **Production:** mapped to the `frontend` branch.
* **Preview:** mapped to all PR branches targeting `frontend`.
* **Development:** pulled locally via `vercel env pull` if desired (most devs use a hand-edited `.env.local` instead).

Required values: see `frontend/.env.example` and [docs/ENVIRONMENT.md](ENVIRONMENT.md).

### Limits & Rollbacks
* **Free-tier limits:** 100 GB bandwidth, 100 GB-hours edge functions per month.
* **Rollback:** instant rollback button in the Vercel deployments dashboard.

## Supabase Deployment via CLI

* **Branch:** `supabase`
* **Watch paths:** `supabase/migrations/**`, `supabase/functions/**`, `supabase/config.toml`

### One-time Setup
```bash
supabase login
supabase link --project-ref <project-ref>
```

### Migrations
```bash
# Local
pnpm db:reset             # drops local DB and re-applies migrations + seed

# Diff after a UI-applied change locally
pnpm db:diff              # capture as a new migration file

# Push to remote project (production)
pnpm db:push
```

### Edge Functions
```bash
# Local
pnpm functions:serve

# Set secrets (per environment)
supabase secrets set --env-file ./supabase/functions/.env

# Deploy
pnpm functions:deploy                       # all functions
supabase functions deploy send-email        # single function
```

### Rollback
* **Migrations:** create a forward "revert" migration. Never edit a merged migration.
* **Functions:** redeploy the previous commit, or `supabase functions delete <name>` if the function was newly added.

## Cloudflare Configuration

### DNS Records
* Apex `A` or `CNAME` → Vercel (proxied, orange cloud).
* `www` `CNAME` → Vercel (proxied, orange cloud).
* MX, SPF, DKIM, DMARC, A (`mail`, `postal`) for the Postal SMTP server (grey cloud, **not** proxied). Records catalogued in [`smtp/dns-records.md`](../smtp/dns-records.md).

### SSL/TLS
* **Mode:** Full Strict.
* **Minimum TLS:** 1.2 (1.3 enabled).

### Rules & Security
* **Page Rules:** cache static assets aggressively.
* **WAF:** OWASP managed rules, plus a custom rule challenging non-residential IPs on `/auth/*`.
* **Rate Limiting:** 1 free rule applied to `/auth/*` (signup and login).
* **Bot Fight Mode:** enabled.
* **Turnstile:** site embedded on signup, login and password-reset forms; verified server-side via the `verify-turnstile` Edge Function.

### Admin route protection (See [docs/ADMIN.md](ADMIN.md))

Three free-tier Cloudflare rules to add via Dashboard → Security → WAF:

1. **Geo-restrict** — block all requests to `codemoteam.org/admin/*` from countries not in your approved list.
2. **Rate-limit auth** — 3 requests per 15 minutes per IP on `/admin/auth`.
3. **Challenge sessionless** — challenge any request to `/admin/*` (excluding `/admin/auth/*`) with no Supabase session cookie.

## Postal SMTP (Oracle Cloud Always-Free VM)

Self-hosted transactional email replaces Resend (See [ADR-0009](adr/0009-postal-smtp-over-resend.md)). Source of truth: [`smtp/`](../smtp/) at the repo root.

### Provisioning
* **VM:** `VM.Standard.A1.Flex` Always-Free shape (4 OCPU / 24 GB RAM ARM Ampere). Region per data-residency preference.
* **OS:** Ubuntu 22.04.
* **Public ports open:** 22, 25, 465, 587, 80, 443.
* **rDNS / PTR:** `mail.codemoteam.org` set in OCI Console → Compute → Edit DNS.
* **TLS:** Let's Encrypt via Certbot, renewed automatically by `certbot.timer`.
* **Stack:** Postal v3 + MariaDB 10.11 + Redis 7, all in `smtp/docker-compose.yml`.

### Hostnames
| Hostname | Purpose |
|---|---|
| `mail.codemoteam.org` | SMTP server (ports 25 / 587 / 465) |
| `postal.codemoteam.org` | Admin web UI (HTTPS via nginx + Certbot) |

### Operational interface
* **Logs:** `docker compose logs -f postal-smtp`
* **Updates:** `docker compose pull && docker compose up -d`
* **Backups:** OCI nightly boot-volume snapshot of the `mariadb-data` volume

### Failure modes & responses
| Symptom | First check |
|---|---|
| Auth emails not arriving | Postal UI → Messages → look for queued/failed sends |
| Gmail marks as spam | Run `check-auth@verifier.port25.com` test, confirm DKIM + SPF + DMARC + rDNS all pass |
| TLS errors on port 587 | `sudo certbot renew --dry-run` and verify `/etc/letsencrypt/live/mail.codemoteam.org` is current |
| `Connection refused` from Edge Function | OCI Security List ingress rule for 587/465 plus host `iptables` |

## Procedures

### Pre-build asset step (every machine, every CI run)
The home page Earth globe loads NASA imagery from `frontend/public/textures/earth/`. That folder is gitignored — run the download script before any build:

```bash
bash frontend/scripts/download-nasa-textures.sh
```

If the script is skipped, `EarthRenderer` automatically falls back to the consent-gated NASA iframe, so builds will not break — but the home page will not show the local Three.js globe until textures are present.

On Vercel, add this command to the **Build Command** chain:

```
bash frontend/scripts/download-nasa-textures.sh && pnpm build
```

### First-Time Deploy Checklist
1. Connect the GitHub repository to Vercel; set production branch to `frontend`, root directory to `frontend`.
2. Populate Vercel env vars for both Production and Preview.
3. Create the Supabase project; capture the URL, anon key and service role key.
4. `supabase link --project-ref <ref>` then `pnpm db:push`.
5. **Postal SMTP setup** (required for any email to leave Supabase):
   1. Provision the Oracle Cloud Always-Free VM and bring up Postal per [`smtp/setup-guide.md`](../smtp/setup-guide.md).
   2. Apply the Cloudflare DNS records from [`smtp/dns-records.md`](../smtp/dns-records.md).
   3. Set the rDNS / PTR record on the VM to `mail.codemoteam.org` via OCI Console.
   4. Provision the `codemoteam.org` mail domain in the Postal admin UI (`postal.codemoteam.org`) and verify DKIM.
   5. Mint an SMTP credential in Postal → Server → Credentials.
6. **Supabase Auth → SMTP**: paste the Postal SMTP credentials (host `mail.codemoteam.org`, port `587`, username + password from Postal credential, sender `noreply@codemoteam.org`).
7. **Supabase Auth → Email Templates**: paste the four HTML files from `supabase/email-templates/` per the table in [docs/SUPABASE.md](SUPABASE.md).
8. `supabase secrets set --env-file ./supabase/functions/.env` then `pnpm functions:deploy`.
9. Apply remaining manual Dashboard settings per [docs/SUPABASE.md](SUPABASE.md).
10. Cloudflare: add the domain, set DNS, set SSL Full Strict, enable Turnstile.
11. **Smoke test:** signup → email confirm arrives → login → password reset arrives → click reset link → set new password.

### Routine Deploy
Merging to `frontend` triggers an automatic Vercel deploy. Merging to `supabase` requires running `pnpm db:push` and `pnpm functions:deploy` from CI (or a maintainer's machine until CI is wired up).

### Emergency Rollback
1. Identify the failing surface (Vercel or Supabase).
2. **Vercel:** instant rollback in the Deployments tab.
3. **Supabase migrations:** push a forward revert migration.
4. **Supabase functions:** redeploy the prior commit.
5. Notify the team. Open an incident.

### Domain Renewal Calendar
Set 30-day-prior reminder. Plan to transfer the domain to Cloudflare Registrar after the 60-day registrar lock for at-cost renewal.
