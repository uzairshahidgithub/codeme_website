# Security Standards

**Last Updated:** 2026-05-07

## Threat Model Summary

We employ STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) per feature during the design phase. Specific threat model documents are stored alongside feature specifications.

## Authentication

* **Provider:** Supabase Auth handles all authentication. There is no custom JWT signing, no custom password hashing and no custom session cookies in this codebase (See ADR-0008).
* **Password hashing:** Argon2id, server-managed by Supabase. Passwords never appear in our logs or tables.
* **Session lifetime:** access tokens 15 minutes, refresh tokens 7 days, sliding window. Refresh-token rotation with reuse detection is mandatory and enabled by default in Supabase.
* **MFA:** TOTP enabled in the Supabase Dashboard. Enforcement deferred to v2.
* **OAuth:** Google and Microsoft (Azure) only for v1. Apple deferred.
* **Lockout policy:** 5 failed sign-in attempts triggers a 15-minute soft-lock (Supabase default).

## Authorisation

* **Primary mechanism:** Row-Level Security at the Supabase Postgres layer.
* **No backend verification tier:** the frontend talks to Supabase directly. RLS is the single authoritative gate.
* **Role hierarchy:** `anon`, `authenticated`, `member`, `moderator`, `admin`, `super_admin`. Roles beyond `authenticated` are stored in `public.profiles.role` and consulted by RLS policies.
* **JWT role claim:** the `custom_access_token_hook` Auth Hook stamps `profiles.role` onto every issued JWT under `claims.role`. RLS predicates and Edge Functions read the claim via `(auth.jwt() ->> 'role')` — never re-query the database for role on every request.
* **Service role key:** used only inside Edge Functions, read from `Deno.env`. Never reaches the browser bundle. Never committed.

### Admin panel (See [docs/ADMIN.md](ADMIN.md))

* Admin routes (`/admin/*`) are isolated — never linked from the public site, accessed by direct URL.
* Email + password authentication only on `/admin/auth`. No OAuth.
* MFA via TOTP is mandatory. `requireAdminPage()` rejects anything below AAL `aal2`.
* Admin sessions are short-lived: 1 hour idle, 8 hours absolute (configured in Supabase Dashboard → Auth → Session).
* Every privileged mutation flows through an Edge Function that re-checks the JWT role claim.
* `audit_log` is INSERT-only at the RLS layer — admins can read it, nobody can update or delete it.
* Cloudflare WAF rules add a defence-in-depth layer: geo-restrict `/admin/*`, rate-limit `/admin/auth` to 3/15min/IP, challenge sessionless requests. Documented in [docs/DEPLOYMENT.md](DEPLOYMENT.md).
* Destructive actions (role promotion, deletion) re-verify the actor's role on the server side before applying.

## Cryptography

* **Transport:** TLS 1.3 minimum, terminated at Cloudflare with origin TLS to Vercel and Supabase (Full Strict).
* **At-rest:** Supabase-managed (AES-256). We do not roll our own at-rest encryption.
* **Custom payload encryption envelope (ADR-0004) is retired:** TLS plus RLS is the security boundary for the MVP. Adding application-layer envelope encryption was speculative; if a future feature needs it (e.g. private messages with end-to-end), we revisit.
* **Key rotation:** OAuth client secrets rotate annually; Supabase JWT secret rotation follows Supabase Dashboard guidance.

## Bot Protection

* **Cloudflare Turnstile** on signup, login and password-reset forms.
* Token verified server-side via the `verify-turnstile` Edge Function before any auth call proceeds.

## Headers

Set in `frontend/proxy.ts` for every response:

* **HSTS:** `max-age=31536000; includeSubDomains` (preload pending DNS verification).
* **X-Frame-Options:** `DENY`.
* **X-Content-Type-Options:** `nosniff`.
* **Referrer-Policy:** `strict-origin-when-cross-origin`.
* **Permissions-Policy:** camera, microphone and geolocation explicitly disabled.
* **Content-Security-Policy:** strict, nonce-based `script-src`. `connect-src` allows `https://*.supabase.co` and `wss://*.supabase.co`.

## Secrets Management

* **Frontend secrets:** stored in Vercel environment variables, scoped per environment.
* **Edge Function secrets:** stored via `supabase secrets set`. Never committed.
* **Local development:** `frontend/.env.local` and `supabase/functions/.env` are gitignored. Never use production values locally.
* **VCS:** secrets must never be committed to Git.

## Incident Response

* **On suspected breach:**
  1. Invalidate all active Supabase sessions (Dashboard → Auth → Users → "Sign out all").
  2. Rotate the Supabase service role key, OAuth client secrets, Postal SMTP credential, and Turnstile secret.
  3. Audit `public.audit_log` and Supabase Auth logs to determine scope.
  4. Notify affected users within 72 hours per GDPR.
* **Leadership:** designate an Incident Commander immediately on detection.
* **Postmortem:** blameless postmortem published internally within 7 days.
* **Action items:** tracked to closure via the issue tracker.

## Vulnerability Management

* **Scanning:** Dependabot on both branches. Trivy CI scans on every PR.
* **Patching SLA:**
  * **Critical CVEs:** 48 hours.
  * **High CVEs:** 7 days.
  * **Medium/Low CVEs:** next scheduled release.
