# ADR-0012: Admin Panel — Supabase RLS + JWT, no separate backend

**Status:** Accepted
**Date:** 2026-05-12

## Context

The admin panel needs role-gated access (admin and super_admin), MFA, audit logging, and the ability to mutate any user-owned table. The simplest implementation pattern would be a separate admin backend service with elevated database credentials, sitting alongside the Vercel frontend. We retired that pattern site-wide in [ADR-0008](0008-drop-railway-supabase-only.md), so reintroducing it here would be a regression.

The question is whether the admin panel justifies an exception. It does not.

## Decision

The admin panel ships on the same Vercel deployment as the public site, in a hidden, role-gated route group at `/admin/*`. Authorisation is enforced in three layers:

1. **Supabase Auth Hook** — `public.custom_access_token_hook(event jsonb)` reads `public.profiles.role` and stamps it onto `claims.role` of every issued JWT. Enabled in Supabase Dashboard → Auth → Hooks.
2. **Row-Level Security** — every admin-touched table (`profiles`, `events`, `courses`, `testimonials`, `articles`, `audit_log`, `site_content`) carries policies of the shape `(auth.jwt() ->> 'role') in ('admin','super_admin')`. The frontend can use the regular anon key; RLS is the gate.
3. **Edge Functions** — privileged mutations (`admin-promote-user`, `admin-ban-user`, `admin-approve-testimonial`, `admin-publish-event`) live in Edge Functions. They re-verify the JWT role claim, perform the mutation with the service-role key, and write an audit-log entry.

MFA (TOTP) is mandatory for any role above `member`. The `requireAdminPage()` server helper rejects authenticators below `aal2`, redirecting to `/admin/auth/mfa-setup` or `/admin/auth/mfa-verify`.

## Consequences

### Positive
* **No additional hosting tier.** Same Vercel deployment, same Supabase project. £0 incremental cost.
* **Role enforcement is uniform.** Public reads, admin writes and Edge Function calls all consult the same JWT claim — no parallel "admin auth model" to keep in sync.
* **Audit trail is database-native.** The `audit_log` table is INSERT-only at the RLS layer; even a compromised admin session cannot tamper with it.
* **Service-role key never reaches the browser.** Held by Edge Functions only.
* **Reuse of existing Supabase Auth.** MFA, password rotation, recovery, session expiry are all stock features.

### Negative
* **Admin code shares a process with public code.** A bug in admin code (e.g. an exception) could in principle leak into public renders. Mitigated by route-group isolation and the locked-components rule (`AdminShell` is its own implementation, the public Navbar/Sidebar are off-limits).
* **No IP allowlist at the application layer.** We rely on Cloudflare WAF for geo-restrict and rate-limit. If the WAF rules misconfigure, the admin URL becomes accessible from anywhere — but the role gate still holds.
* **Admin URL discoverable.** `/admin/*` is a guessable path. Mitigated by Cloudflare WAF challenges plus the role gate; no information leaks even if probed.

### Reversibility
Reintroducing a separate admin backend (e.g. a dedicated Vercel project, or a small Node service on Fly) is straightforward:

1. Move `app/admin/*` and `lib/admin/*` into the new project.
2. Re-point the four admin Edge Functions or rewrite as conventional API routes.
3. Add a Cloudflare DNS record for `admin.codemoteam.org`.
4. Tighten Cloudflare WAF to lock the admin host to office IPs.

No data migration required. RLS and the JWT hook continue to work unchanged.
