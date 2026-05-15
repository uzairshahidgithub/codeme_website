# Backend Architecture (deprecated)

**Last Updated:** 2026-05-07
**Status:** Deprecated. Retained as a redirect.

The standalone Node.js/Fastify API on Railway has been retired (See [ADR-0008](adr/0008-drop-railway-supabase-only.md)).

The backend is now Supabase only. Refer to:

* [SUPABASE.md](SUPABASE.md) — schema rules, RLS, Edge Functions inventory.
* [ARCHITECTURE.md](ARCHITECTURE.md) — system topology.
* [API-RULES.md](API-RULES.md) — request/response envelope and CORS for Edge Functions.

This file will be removed after one release cycle.
