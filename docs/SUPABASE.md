# Supabase Configuration & Standards

**Last Updated:** 2026-05-07

The MVP runs on a single Supabase project. Multi-project federation is retired (See ADR-0008).

## Required Manual Dashboard Settings

These settings cannot be expressed in code. Apply them in the Supabase Dashboard.

### Auth → Providers
* **Email**: enabled.
  * **Confirm email** is currently **OFF**. ⚠️ **Temporary** — re-enable as soon as Postal SMTP is configured. See "Auth → SMTP (custom)" below.
  * **Secure email change** is currently **OFF** for the same reason. Re-enable alongside Confirm email.
* **Google**: OAuth credentials set in Dashboard (NOT env vars). Redirect URI: `https://<ref>.supabase.co/auth/v1/callback`.
* **Microsoft (Azure)**: OAuth credentials set in Dashboard. Same redirect URI pattern.
* **Apple:** deferred to v2.

> **Temporary state — signup verification disabled.**
> Until Postal is bootstrapped on the Oracle VM (See [`smtp/setup-guide.md`](../smtp/setup-guide.md)) and credentials are pasted into Supabase Auth → SMTP, signup confirmation emails cannot be delivered, so `enable_confirmations` is set to `false` in `supabase/config.toml` and the corresponding Dashboard toggles are off. The frontend signup flow skips `/auth/signup/verify` and goes straight to `/auth/signup/success`.
>
> **To restore verification once SMTP is live:**
> 1. Set `enable_confirmations = true` and `double_confirm_changes = true` in `supabase/config.toml` `[auth.email]`.
> 2. Toggle "Confirm email" and "Secure email change" back **on** in the Dashboard.
> 3. Restore the redirect in `frontend/app/auth/signup/career/page.tsx` from `router.replace('/auth/signup/success')` back to `router.push('/auth/signup/verify')`.

### Auth → SMTP (custom)

Default Supabase SMTP only delivers to the project owner's email and is hard-rate-limited to 3-4/hour. Production uses our self-hosted **Postal v3** server on an Oracle Cloud Always-Free VM (See [ADR-0009](adr/0009-postal-smtp-over-resend.md)).

Dashboard → **Project Settings → Auth → SMTP Settings** → enable custom SMTP and apply:

| Field | Value |
|---|---|
| Sender email | `noreply@codemoteam.org` |
| Sender name | `Codemo Teams` |
| Host | `mail.codemoteam.org` |
| Port | `587` (STARTTLS) |
| Username | _SMTP credential username from Postal Admin UI_ |
| Password | _SMTP credential password from Postal Admin UI_ |

The sender domain `codemoteam.org` must be provisioned and DKIM-verified in the Postal admin UI before sends succeed.

#### Provisioning the SMTP server

The server lives at [`smtp/`](../smtp/) in this repo. Step-by-step VM provisioning, DNS records, Certbot, Postal bootstrap and credential generation are documented in [`smtp/setup-guide.md`](../smtp/setup-guide.md). DNS records are catalogued in [`smtp/dns-records.md`](../smtp/dns-records.md).

### Auth → Email Templates
Brand all four templates with sender name `Codemo Teams`. The HTML bodies are version-controlled at `supabase/email-templates/` — copy each file's contents into the Dashboard exactly as authored.

| Template | Subject | Source |
|---|---|---|
| Confirm signup | `Confirm your Codemo account` | `supabase/email-templates/confirm-signup.html` |
| Magic link | `Your Codemo sign-in link` | `supabase/email-templates/magic-link.html` |
| Password recovery | `Reset your Codemo password` | `supabase/email-templates/recovery.html` |
| Email change | `Confirm your new Codemo email` | `supabase/email-templates/email-change.html` |

The recovery template's confirmation URL must point at `{{ .SiteURL }}/auth/callback?type=recovery` (already set in the source file).

### Auth → URL Configuration
* **Site URL:** `https://codemoteam.org`
* **Redirect URL allowlist:**
  ```
  https://codemoteam.org/auth/callback
  https://codemoteam.org/auth/update-password
  http://localhost:3000/auth/callback
  http://localhost:3000/auth/update-password
  ```

### Auth → Rate Limits
* **Sign-up:** 5 / hour per IP.
* **Password recovery:** 5 / hour per email.
* **Sign-in:** 5 failed attempts per email triggers a 15-minute soft-lock (Supabase default).

### Auth → MFA
* **TOTP:** enabled. Enforcement deferred to v2.

### Storage → user-avatars bucket
| Setting | Value |
|---|---|
| Public | off |
| File-size limit | 2 MiB |
| MIME allowlist | `image/jpeg, image/png, image/webp, image/gif` |

The bucket and its RLS policies are created by `supabase/migrations/20260430000000_init.sql`.

### Storage → event-assets bucket
| Setting | Value |
|---|---|
| Public | off |
| File-size limit | 10 MiB |
| MIME allowlist | `image/jpeg, image/png, image/webp, application/pdf` |
| Folders | `banners/`, `cert-templates/`, `generated-certs/{event_id}/{user_id}.pdf` |

Created by `supabase/migrations/20260513000000_events_full.sql`. RLS:
* Admins write anywhere in the bucket.
* Authenticated users read banner objects.
* Each user reads only their own `generated-certs/{event_id}/{user_id}.pdf` (matched via `auth.uid()::text = split_part(name, '/', 3)`).
* All reads delivered via signed URLs (banners on demand, certs with 7-year expiry).

### Database → Replication
Disable for any table that does not need realtime. The MVP enables realtime on no tables.

### API → Settings
CORS allowed origins: `https://codemoteam.org`, `http://localhost:3000`.

## Public Tables

| Table | Public read filter | Admin? | Notes |
|---|---|---|---|
| `public.profiles` | open SELECT (own writes) | admins read all, super_admins write | Mirrors `auth.users` via `handle_new_user()` trigger. Now carries `role` enum used by JWT hook. |
| `public.audit_log` | service-role only | admins read | INSERT-only audit trail. |
| `public.events` | `status = 'published'` | admins read all + write | Full event records (title, description, mode, location, category, recurrence, banner, max_attendees, cert). Home page surfaces nearest 3. |
| `public.event_registrations` | own rows (user_id) | admins read all + update attendance/cert | One row per `(event_id, user_id)`. Tracks attendance and certificate issuance. |
| `public.event_recurring_instances` | open SELECT | admins write | Per-instance overrides for events expanded from `recurrence_rule` (RRULE). |
| `public.courses` | `status = 'published'` | admins read all + write | eLearn highlights on home page. |
| `public.testimonials` | `approved = true` | admins read all + write | Home page community-reviews section. |
| `public.articles` | `status = 'published'` | admins read all + write | Editorial articles, surfaced on `/articles` and admin panel. |
| `public.site_content` | open SELECT | admins write | Key/value editable copy. |
| `public.admin_stats` (view) | n/a (call via RPC) | admin only via `get_admin_stats_secured()` | Aggregate view for the admin dashboard. |

## Admin role + JWT hook (See [docs/ADMIN.md](ADMIN.md) and [ADR-0012](adr/0012-admin-panel-supabase-rls-jwt.md))

`public.profiles.role` is `member | moderator | admin | super_admin`. The hook below stamps it onto every JWT under `claims.role`:

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
declare
  user_role text;
  claims    jsonb;
begin
  select p.role into user_role from public.profiles p
   where p.id = (event ->> 'user_id')::uuid;
  claims := event -> 'claims';
  claims := jsonb_set(claims, '{role}', to_jsonb(coalesce(user_role, 'member')));
  return jsonb_set(event, '{claims}', claims);
end; $$;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
```

**Required Dashboard step:** Auth → Hooks → Custom Access Token → select `public.custom_access_token_hook`. Without this step the JWT claim is absent and every admin route returns "Access denied".

Standard admin RLS predicate:

```sql
create policy "<table>: admin all"
  on public.<table> for all
  using ((auth.jwt() ->> 'role') in ('admin', 'super_admin'))
  with check ((auth.jwt() ->> 'role') in ('admin', 'super_admin'));
```

Dashboard stat RPCs (all `security definer`, all role-checked at call time): `get_admin_stats_secured()`, `get_user_growth_30d()`, `get_role_breakdown()`. Frontend calls these via `supabase.rpc(name)`.

All write paths are restricted to the service role inside Edge Functions.

## Schema Rules

1. Every table has a `uuid` primary key (default `gen_random_uuid()`).
2. Every table has `created_at` and `updated_at` (with timezone).
3. Tables containing user data have a `user_id` column referencing `auth.users(id)` (or use `id` directly when the row is one-to-one with the user, as in `profiles`).
4. Soft deletes via nullable `deleted_at` only when retention requires it.
5. `snake_case` columns, plural `snake_case` table names.

## Row-Level Security

* RLS enabled on every table without exception. No table is created with RLS disabled.
* Default state is **deny all**. Explicit policies open specific access.
* Standard policies:
  * `read-own`: `auth.uid() = user_id` (or `auth.uid() = id` for `profiles`).
  * `write-own`: same predicate, `with check` mirrored.
  * `admin-all`: handled by service role inside Edge Functions; service role bypasses RLS by design, so no explicit policy is required for it.

Reference template (replace placeholders):

```sql
alter table public.<table> enable row level security;

create policy "<table>: read own"
  on public.<table> for select
  using (auth.uid() = user_id);

create policy "<table>: insert own"
  on public.<table> for insert
  with check (auth.uid() = user_id);

create policy "<table>: update own"
  on public.<table> for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Migrations

* Every schema change is a versioned migration in `supabase/migrations/`.
* Filenames follow `YYYYMMDDHHMMSS_<slug>.sql` (matches the Supabase CLI default).
* **NEVER** edit a merged migration. Always create a new forward migration.
* Apply locally with `pnpm db:reset`. Push to remote with `pnpm db:push`.

## Edge Functions Inventory

Path: `supabase/functions/<name>/index.ts`. All functions are Deno + TypeScript.

| Function | Purpose | Auth |
|---|---|---|
| `send-email` | Relays through self-hosted Postal SMTP via authenticated submission | JWT required |
| `admin-promote-user` | Changes a profile role | super_admin |
| `admin-ban-user` | Bans / unbans a user via Supabase Auth admin API | admin+ |
| `admin-approve-testimonial` | Toggles `testimonials.approved` | admin+ |
| `admin-publish-event` | Sets `events.status` (draft/published/archived) | admin+ |
| `mark-attendance` | Bulk-updates `event_registrations.attended` for given user IDs | admin+ |
| `generate-cert` | Overlays attendee name/event/date onto the cert template (PDF or PNG/JPEG via pdf-lib), uploads to `event-assets/generated-certs/{event_id}/{user_id}.pdf`, signs the URL (7y), updates the registration | admin+ |
| `send-cert-email` | Looks up attendee email, sends branded HTML email with cert download link via Postal SMTP | admin+ |
| `verify-turnstile` | Server-side Turnstile token verification | None (called pre-auth) |
| `delete-account` | Cascades user deletion, audits, removes avatars | JWT required |
| `export-data` | GDPR-style data export, returns 5-min signed URL | JWT required |

All functions:

1. Validate input with Zod.
2. Read service role key from `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` only inside the function.
3. Return the standard envelope `{ data, error, meta }`.
4. CORS allowlist: `https://codemoteam.org`, `http://localhost:3000`.
5. Never log secrets or full request bodies.

Deploy: `pnpm functions:deploy <name>` or all via `supabase functions deploy`.

## Auth Integration

* Supabase Auth manages password hashing (Argon2id), session tokens, social OAuth, MFA, recovery and verification.
* Frontend uses `auth.uid()` implicitly via RLS; no custom JWT verification in the client.
* Profile metadata (`username`, `dob`, `gender`, `domain`, `status`) is written to `auth.users.raw_user_meta_data` during signup, then mirrored into `public.profiles` by the `handle_new_user()` trigger.

## Storage Rules

* `user-avatars`: per-user folder (`<user_id>/avatar.<ext>`). RLS restricts each user to their own folder.
* Reads served via signed URLs (5-minute TTL). Public reads are off.
