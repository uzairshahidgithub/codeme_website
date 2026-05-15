# Admin Panel

**Last Updated:** 2026-05-13

> **⚠ TEMPORARY STATE (2026-05-13).** Verification (JWT role claim + MFA AAL2) is disabled for in-team testing. Any user with a Supabase account who signs in at `/admin/auth` is treated as `super_admin` and reaches the dashboard. To restore: uncomment the `// RESTORE` blocks in `frontend/lib/admin/auth.ts`, restore the role/MFA branches in `frontend/app/admin/auth/page.tsx` (see git history), confirm the Auth → Hooks → Custom Access Token mapping, and toggle MFA enforcement back on in the Supabase Dashboard.

**Default test admin:** create one through the public signup at `/auth/signup` (email + password of your choosing). Until verification is restored, any account works as admin.

The admin panel is a hidden, role-gated, MFA-enforced surface for moderators, admins and super_admins. It lives at `/admin/*` on the same Vercel deployment as the public site (See [ADR-0012](adr/0012-admin-panel-supabase-rls-jwt.md) for why no separate admin backend).

## Route Map

```
/admin/auth                        — sign-in (email + password only, no OAuth)
/admin/auth/mfa-setup              — TOTP enrolment with QR code
/admin/auth/mfa-verify             — TOTP challenge before dashboard
/admin                             — dashboard (stats, charts, recent audit, quick actions)
/admin/users                       — stub: search, ban, promote
/admin/events                      — list every event (any status) with category, mode, date, status pill
/admin/events/new                  — full create form
/admin/events/[id]/edit            — full edit form
/admin/events/[id]/attendance      — mark attendance, issue + email certificates
/admin/articles                    — stub: draft, edit, publish
/admin/courses                     — stub: curate eLearn
/admin/testimonials                — stub: approve/reject
/admin/settings                    — stub: edit site_content rows
/admin/audit-log                   — stub: full audit trail with filters
```

Routing is split into two segments under `app/admin/`:

* `app/admin/auth/*` — public-facing auth pages, no role gate. Their own `layout.tsx` is a pass-through.
* `app/admin/(panel)/*` — protected route group. `(panel)/layout.tsx` calls `requireAdminPage()` which gates on JWT role + MFA, then renders `AdminShell`.

## Role Model

`public.profiles.role` is an enum of `member | moderator | admin | super_admin`. Roles are read by `custom_access_token_hook` and stamped into the JWT on every token issuance under `claims.role`. Server components and Edge Functions trust the JWT claim — no extra database round-trip per request.

| Role | Read admin pages | Write content | Promote roles | Notes |
|---|---|---|---|---|
| `member` | ✗ | ✗ | ✗ | Default for everyone |
| `moderator` | ✗ (v1) | ✗ | ✗ | Reserved for future moderation tools |
| `admin` | ✓ | ✓ | ✗ | Cannot edit roles |
| `super_admin` | ✓ | ✓ | ✓ | Only role allowed to call `admin-promote-user` |

## Auth Flow

1. **Sign in** at `/admin/auth` with email + password. No OAuth. No social.
2. Supabase issues a JWT with `claims.role` already populated (via the hook).
3. Frontend decodes the JWT client-side and **rejects immediately** if role is not in `['admin', 'super_admin']` — signs out, shows "Access denied", does not redirect to dashboard.
4. If admin role:
   * No verified TOTP factor → `/admin/auth/mfa-setup` (QR + 6-digit confirm)
   * Verified factor exists, current AAL < `aal2` → `/admin/auth/mfa-verify` (challenge)
   * Verified factor + AAL `aal2` → `/admin` dashboard
5. Every protected admin page calls `requireAdminPage()` from `lib/admin/auth.ts` which re-checks role and AAL on every request.

Sessions are short on admin: 1 hour idle, 8 hours absolute (set in Supabase Dashboard → Auth → Session, not in code).

## Edge Functions

Path: `supabase/functions/`. All four follow the same pattern: `requireAdmin(req, origin, role)` from `_shared/admin.ts` → Zod input validation → service-role mutation → `audit()` insert → envelope response.

| Function | Required role | Purpose |
|---|---|---|
| `admin-promote-user` | `super_admin` | Change a user's role. Cannot self-promote. |
| `admin-ban-user` | `admin` | Ban / unban a user via `auth.admin.updateUserById({ ban_duration })`. |
| `admin-approve-testimonial` | `admin` | Set `testimonials.approved = true/false`. |
| `admin-publish-event` | `admin` | Set `events.status = draft|published|archived`. |
| `mark-attendance` | `admin` | Bulk-flip `event_registrations.attended` for a given event. Audit: `event.attendance_marked`. |
| `generate-cert` | `admin` | Render attendee certificate from the event's template (PDF or PNG/JPEG via `pdf-lib`), upload to Storage, sign URL (7 years), update registration. Audit: `cert.generated`. |
| `send-cert-email` | `admin` | Email the cert link to the attendee via Postal SMTP. Audit: `cert.emailed`. |

## Event Management

`/admin/events` lists every event regardless of status (draft, published, cancelled, completed). Columns: title + location, category badge, mode badge, start time, status pill, edit + attendance links.

### Create / edit
`/admin/events/new` and `/admin/events/[id]/edit` render the same `EventForm` client component. Single scrollable form (admin is a power user — no multi-step wizard). Fields:

1. **Title** — required, 3–100 chars.
2. **Description** — required, 20–2000 chars, multiline.
3. **Mode** — Online or Physical (pill toggle). The location title + link inputs reskin themselves around the chosen mode.
4. **Duration** — native `datetime-local` start + end. Live duration label in `var(--text-muted)`. Validates `ends_at > starts_at` and `≥ 15 min`.
5. **Category** — pill chip group: Webinar, Bootcamp, Workshop, Hackathon, Seminar, Conference, Other.
6. **Recurring event** — toggle switch. When on: pick Yearly / Monthly / Weekly + optional human label. The form composes a simple RRULE string (`FREQ=YEARLY;BYMONTH=…;BYMONTHDAY=…` etc.) from the start datetime.
7. **Banner image** — uploads to `event-assets/banners/`, max 5 MB, JPEG/PNG/WebP. Inline preview. Stored as a long-lived signed URL.
8. **Max attendees** — optional number; falls back to "Unlimited".
9. **Certificate** — toggle. When on, uploads a PDF or PNG template to `event-assets/cert-templates/` and stores the signed URL on `events.cert_template_url`. Helper text reminds the designer to include `{name} {event} {date}` placeholders.

Submit buttons: "Save as Draft" (`status = 'draft'`) and "Publish Event" (`status = 'published'`). Inserts/updates go through the standard Supabase client — RLS gates writes to admins via the JWT `role` claim. Once published, the event auto-appears on the user-facing `/events` calendar + tabs and on the home-page `EventsHighlights` (nearest 3, ascending).

> **Trade-off:** the spec calls for a custom Codemo-themed calendar+time picker on the create form, reused from the user-facing `EventCalendar`. v1 ships native `datetime-local` inputs styled with the `codemo-input` utility — accessible, keyboard-friendly, locale-correct out of the box. Reusing the month-grid `EventCalendar` as a date picker is tracked for the next admin sprint.

### Attendance + certificates
`/admin/events/[id]/attendance` lists every `event_registrations` row joined with `profiles` (display name + handle). Columns: User · Display name · Registered · Attended (checkbox) · Cert · Action. Filter pills: All / Attended / Not Attended / Cert Issued.

* Toggling **Attended** calls `mark-attendance` with `{ event_id, user_ids: [user_id], attended }`.
* **Issue Cert** (only enabled when `attended=true`, `cert_enabled=true`, template exists) calls `generate-cert` then `send-cert-email` sequentially.
* **Issue All Certs** runs the same pair across every attended-but-not-issued row sequentially to avoid an SMTP burst.
* Each issued row links to its signed cert URL.

Audit log entries are written by `_shared/admin.ts → audit()` on every successful mutation. The `audit_log` table is INSERT-only at the RLS layer (admins can `SELECT` to view, nobody can `UPDATE` or `DELETE`).

## Cloudflare WAF Rules (production)

These are free-tier Cloudflare rules to add via Dashboard → Security → WAF:

1. **Geo-restrict admin** — block all requests to `codemoteam.org/admin/*` from countries not in your approved list (start with your own country only).
2. **Rate-limit admin auth** — 3 requests per 15 minutes per IP on `/admin/auth`.
3. **Challenge no-session admin** — challenge requests to `/admin/*` (excluding `/admin/auth/*`) when no Supabase session cookie is present.

These complement the server-side role gate; defence in depth.

## Stat Sources

The dashboard reads three RPCs (all `security definer`, all role-checked at call time):

| RPC | Returns |
|---|---|
| `get_admin_stats_secured()` | `total_users`, `new_users_week`, `new_users_month`, `active_today`, `active_events`, `active_courses`, `pending_testimonials`, `draft_articles` |
| `get_user_growth_30d()` | One row per day for the last 30 days with `(day, signups)` |
| `get_role_breakdown()` | `(role, total)` rows for the donut chart |

The underlying `admin_stats` view is `GRANT SELECT ON … TO authenticated`, but each RPC re-checks `auth.jwt() ->> 'role'` and raises `42501` if the caller is not an admin. The view is never queried directly from the frontend.

## Future Stub Backlog

Each stub renders `AdminStub` with a `// TODO: implement {feature} feature in next sprint` comment. When picking up a stub:

1. Replace the stub component with the real list/table view.
2. Keep server-component data fetching (use `createClient()` from `@/lib/supabase/server`).
3. Mutations always go through an Edge Function — no direct service-role calls from the frontend.
4. Every mutation must `audit()` log inside the Edge Function.
5. Add the route to the audit-log filters once that page is fleshed out.

## Locked Dependencies

The admin panel reuses public design tokens, the `CodemoLogo` component, the `useThemeStore` and the existing `createClient` Supabase helpers. It must NOT modify the public Navbar, Sidebar, BotDock or BottomNav — those are locked components owned by the frontend layout team. `AdminShell` is its own implementation that mirrors the public visual language without sharing code paths.
