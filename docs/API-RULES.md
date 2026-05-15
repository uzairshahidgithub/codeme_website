# API Design Rules

**Last Updated:** 2026-05-07

These rules apply to **Supabase Edge Functions** under `supabase/functions/`. There is no separate API server (See [ADR-0008](adr/0008-drop-railway-supabase-only.md)). Most user-scoped CRUD goes directly from the browser to Supabase via PostgREST and is governed by RLS, not by these rules — these rules cover the Edge Function surface only.

## Function URLs

Supabase serves functions at `https://<ref>.supabase.co/functions/v1/<name>`. We do not introduce a custom API subdomain.

## Function Naming

* Lower-case, hyphen-separated, verb-led: `send-email`, `verify-turnstile`, `delete-account`, `export-data`.
* One concern per function. If a function grows past one concern, split it.

## Request Rules

* **Method:** POST for state-changing or side-effectful operations; GET allowed only for pure reads (rare for Edge Functions).
* **Content-Type:** `application/json`.
* **Authentication:** Authenticated functions require `Authorization: Bearer <supabase-jwt>`. The function verifies the JWT via `supabase.auth.getUser(token)` before any side effect.
* **Validation:** Inputs validated with Zod. Validation failure → `422` with `{ error: "Validation failed", meta: { fields: ... } }`.

## Response Envelope

All responses use the canonical envelope:

```json
{ "data": <result | null>, "error": <message | null>, "meta": { ... } }
```

* `data` is the result on success.
* `error` is a string message on failure, never an object. Internal details go in `meta` only when safe to expose.
* `meta` is for paging cursors, rate-limit hints, validation field maps, etc.

## CORS

Allowlist exact origins, never `*`:

```ts
const ALLOWED_ORIGINS = ['https://codemoteam.org', 'http://localhost:3000']
```

Respond to OPTIONS pre-flight with `204`.

## Status Code Conventions

* `200 OK` — successful read, write, or operation that returns data.
* `204 No Content` — successful pre-flight (OPTIONS only).
* `400 Bad Request` — malformed JSON.
* `401 Unauthorised` — missing or invalid JWT.
* `403 Forbidden` — authenticated but lacking permission.
* `404 Not Found` — resource does not exist.
* `409 Conflict` — duplicate unique key, optimistic-lock failure.
* `422 Unprocessable Entity` — Zod rejection.
* `429 Too Many Requests` — rate limit exceeded.
* `500 Internal Server Error` — unhandled.

## Rate Limiting

* Supabase Auth endpoints have built-in per-email and per-IP limits — see [SUPABASE.md](SUPABASE.md).
* Cloudflare WAF rate-limits the public surface (`/auth/*`).
* Edge Functions do not currently apply per-function rate limits. Add them with a Redis or KV store when the need arises.

## Secrets

* `SUPABASE_SERVICE_ROLE_KEY` is read inside the function from `Deno.env`. It is never logged, never returned to the caller, and never embedded in error messages.
* Other secrets (`SMTP_USER`, `SMTP_PASS`, `TURNSTILE_SECRET_KEY`) follow the same rules.

## Audit Logging

State-changing functions must emit a row to `public.audit_log` with `{ user_id, action, metadata }`. Examples: `account.delete`, `account.export`, `email.sent`, `event.attendance_marked`, `cert.generated`, `cert.emailed`.

## Events Edge Functions

| Endpoint | Method | Auth | Body schema | Purpose |
|---|---|---|---|---|
| `/functions/v1/mark-attendance` | POST | admin+ | `{ event_id: uuid, user_ids: uuid[] (1..500), attended: boolean }` | Bulk-update `event_registrations.attended`. Returns `{ updated: number }`. |
| `/functions/v1/generate-cert` | POST | admin+ | `{ event_id: uuid, user_id: uuid }` | Renders cert from template (PDF or PNG/JPEG via `pdf-lib`), uploads to `event-assets/generated-certs/{event_id}/{user_id}.pdf`, signs URL (7 years), updates `event_registrations.cert_url + cert_issued`. Returns `{ cert_url }`. |
| `/functions/v1/send-cert-email` | POST | admin+ | `{ event_id: uuid, user_id: uuid }` | Emails the signed cert URL via Postal SMTP. Branded HTML. Returns `{ sent: true }`. |

Rate-limit guidance: bulk cert issuance triggers `generate-cert` then `send-cert-email` sequentially per attendee from the admin UI to avoid SMTP bursts. There is no per-function quota in v1; add Redis-backed limits if abuse appears.

## Idempotency

Functions that have observable side effects (email send, account delete, export generation) should accept an optional `Idempotency-Key` header in v2. For v1, callers are expected to debounce client-side.

## Deprecation Policy

* A function marked deprecated must keep accepting requests for at least 90 days.
* Deprecation is announced in `docs/CHANGELOG.md` and via a `Deprecation: true` response header.
* The replacement function name goes into the `Sunset` header alongside the removal date.
