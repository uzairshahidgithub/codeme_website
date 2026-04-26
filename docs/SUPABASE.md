# Supabase Configuration & Standards

**Last Updated:** 2026-04-26

## Project Registry

| Project | Purpose | URL Placeholder | Primary Tables |
|---------|---------|-----------------|----------------|
| `codemo-core` | Core identity and audit | `SUPABASE_URL_CORE` | `users`, `sessions`, `profiles`, `audit_log` |
| `codemo-articles` | Article engine | `SUPABASE_URL_ARTICLES` | `articles`, `comments`, `reactions`, `media_refs` |
| `codemo-events` | Event coordination | `SUPABASE_URL_EVENTS` | `events`, `attendees`, `schedules` |

*(Add rows as new projects are provisioned.)*

## Schema Rules

1. Every table must have an `id` column defined as a UUID primary key (default: `gen_random_uuid()`).
2. Every table must include `created_at` and `updated_at` timestamps (with timezone).
3. Any table containing user-related data must include a `user_id` UUID referencing `codemo-core.users.id`.
4. Implement soft deletes using a nullable `deleted_at` timestamp where data retention is necessary.
5. Naming convention: `snake_case` for columns, plural `snake_case` for table names.

## Row-Level Security (RLS)

* RLS must be enabled on every table without exception.
* The default policy state is "Deny All".
* Explicit policies must be defined for `authenticated`, `anon`, and `service_role`.
* Ensure policy templates cover `read-own`, `write-own`, and `admin-all` scenarios.

## Migrations

* Every schema change must go through a versioned migration file.
* Migrations are versioned by a timestamp prefix.
* Migration files must be checked into the repository under `backend/migrations/<project>/`.
* Rollback (down) migrations must be provided where automatic rollback is not supported by the tool.
* **NEVER** edit a merged migration file; always create a new forward migration.

## Auth Integration

* Supabase Auth manages password hashing (Argon2id), session tokens, and social OAuth.
* The backend strictly uses `auth.uid()` to scope and restrict queries.
* Custom claims are injected via Auth Hooks for robust role-based access control (RBAC).

## Storage Rules

* User uploads are stored in dedicated buckets, segregated by feature.
* Bucket policies strictly enforce per-user isolation.
* Only use Signed URLs. Public URLs for user content are forbidden.
* Implement mime-type sniffing and magic byte verification on the server before accepting any file upload.

## Realtime Rules

* Realtime subscriptions are permitted only on tables with explicit RLS approval.
* Channel naming convention: `<feature>:<resource>:<id>`.
* Clients must implement robust disconnect handling and exponential reconnect backoffs.
