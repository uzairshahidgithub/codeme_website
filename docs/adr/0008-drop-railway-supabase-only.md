# ADR-0008: Drop Railway. Supabase-only backend

**Status:** Accepted
**Date:** 2026-05-07
**Supersedes:** ADR-0002 (partial — Railway tier), ADR-0003 (multi-project federation), ADR-0004 (payload encryption envelope)

## Context

The original architecture (ADR-0002) provisioned a Node.js/Fastify API on Railway, sitting between the Vercel frontend and a federation of Supabase projects (ADR-0003). On top of this we layered an application-level payload encryption envelope (ADR-0004) and a roster of custom secrets — `JWT_SIGNING_SECRET`, `CSRF_SECRET`, `API_PRIVATE_KEY`, `PAYLOAD_PRIVATE_KEY` — to harden inter-tier traffic.

For the v1 product surface (auth, profile, articles, events, eLearn, projects) almost every backend endpoint is a thin pass-through that re-derives `auth.uid()` from a Supabase JWT and runs a single CRUD against Postgres. Supabase's PostgREST layer plus RLS policies do exactly this work directly. Adding a Node tier in the middle was costing us a hosting line, a deploy target, and an entire surface of custom auth code.

A move-fast-on-free-tier evaluation revealed:

* The Railway Hobby plan was the only chargeable line ($5/month) in an otherwise £0 stack.
* The custom JWT/CSRF/encryption envelope was solving threats already covered by TLS 1.3 (Cloudflare) plus RLS (Supabase).
* Multi-project federation (ADR-0003) was hedging against free-tier limits we are not within an order of magnitude of hitting.

## Decision

We retire Railway and the custom Node API. We collapse to:

* **Frontend:** Next.js on Vercel (unchanged).
* **Backend:** Supabase only — Postgres + Auth + Storage + Edge Functions + Realtime.
* **Edge:** Cloudflare for DNS, SSL Full Strict, WAF, Turnstile.

The frontend talks to Supabase directly via `@supabase/ssr`. RLS is the authoritative authorisation gate. Edge Functions (Deno, TypeScript) cover the small set of cases that genuinely need a server secret: Resend email, Turnstile siteverify, account deletion, data export.

We also collapse the multi-project federation to a single Supabase project. ADR-0003 is superseded; if any free-tier limit reaches 80% utilisation we revisit.

The custom payload encryption envelope (ADR-0004) is retired. TLS plus RLS is the security boundary for the MVP. End-to-end-encrypted features (e.g. private messages) can reintroduce envelope encryption when the requirement appears.

Branches: only `frontend` and `supabase` remain on the remote. The `backend` and `shared` branches are removed.

## Consequences

### Positive
* Total monthly cost drops to £0 (excluding the ~£8/year domain).
* One fewer deploy target, one fewer environment, one fewer set of secrets to rotate.
* Auth surface becomes Supabase Auth wholesale: Argon2id, Google + Azure OAuth, MFA TOTP, password recovery, email verification, secure email change. No bespoke crypto.
* RLS becomes the single, auditable source of truth for authorisation.
* Frontend can use Realtime directly without a relay.

### Negative
* Heavy backend logic that genuinely doesn't fit RLS (cross-table aggregations, third-party webhooks, cron jobs) must live in Edge Functions. Edge Functions have a Deno runtime, cold starts on the free tier, and a 50 MB-deployed limit. We accept this; if a future feature demands a long-running Node process we reopen the question.
* `service_role` key handling moves entirely into Edge Functions. The discipline of "never put it in the browser bundle" must be enforced via review.
* No custom rate-limit tier between Cloudflare and Supabase. Supabase Auth's built-in limits plus Cloudflare WAF rate-limits are the only line of defence against abuse. We tune these in the Dashboard.

### Reversibility
The decision is reversible. If we need to reintroduce a Node API later, we can stand up a `backend/` workspace and a Railway target without touching Supabase data. Migrations are one-way only by convention; Edge Functions are stateless.
